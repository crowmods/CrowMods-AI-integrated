const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  scalingDecision,
  costScore
}=require("./controller");
const {MemoryAutoscalingAdapter}=require("./adapter");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const adapter=new MemoryAutoscalingAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:72,
  service:"autoscaling-controller"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/autoscaling/policies",async(req,res)=>{
  const {
    consumerGroup,
    minWorkers=1,
    maxWorkers=20,
    targetLag=100,
    scaleStep=1,
    cooldownSeconds=300,
    scaleInEnabled=true
  }=req.body||{};

  if(!consumerGroup)
    return res.status(400).json({
      error:"consumerGroup is required"
    });

  if(minWorkers<1||maxWorkers<minWorkers||
     scaleStep<1||cooldownSeconds<0)
    return res.status(400).json({
      error:"Invalid autoscaling policy"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO autoscaling_policies
        (consumer_group,min_workers,max_workers,target_lag,
         scale_step,cooldown_seconds,scale_in_enabled)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(consumer_group)
      DO UPDATE SET
        min_workers=EXCLUDED.min_workers,
        max_workers=EXCLUDED.max_workers,
        target_lag=EXCLUDED.target_lag,
        scale_step=EXCLUDED.scale_step,
        cooldown_seconds=EXCLUDED.cooldown_seconds,
        scale_in_enabled=EXCLUDED.scale_in_enabled,
        enabled=true
      RETURNING *
    `,[
      consumerGroup,
      minWorkers,
      maxWorkers,
      targetLag,
      scaleStep,
      cooldownSeconds,
      scaleInEnabled
    ]);

    res.status(201).json({policy:rows[0]});
  }catch{
    res.status(500).json({error:"Could not save policy"});
  }
});

app.get("/api/autoscaling/policies",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM autoscaling_policies
      WHERE enabled=true
      ORDER BY consumer_group
    `);

    res.json({policies:rows});
  }catch{
    res.status(500).json({error:"Could not load policies"});
  }
});

app.post("/api/autoscaling/plan",async(req,res)=>{
  const {
    consumerGroup,
    currentWorkers,
    desiredWorkers,
    unitCost=1,
    budget=Infinity
  }=req.body||{};

  if(!consumerGroup||
     currentWorkers===undefined||
     desiredWorkers===undefined)
    return res.status(400).json({
      error:"consumerGroup, currentWorkers and desiredWorkers are required"
    });

  try{
    const policy=(await pool.query(`
      SELECT *
      FROM autoscaling_policies
      WHERE consumer_group=$1 AND enabled=true
    `,[consumerGroup])).rows[0];

    if(!policy)
      return res.status(404).json({
        error:"Autoscaling policy not found"
      });

    const recent=(await pool.query(`
      SELECT created_at
      FROM scaling_actions
      WHERE consumer_group=$1
      ORDER BY created_at DESC
      LIMIT 1
    `,[consumerGroup])).rows[0];

    const decision=scalingDecision({
      currentWorkers:Number(currentWorkers),
      desiredWorkers:Number(desiredWorkers),
      minWorkers:policy.min_workers,
      maxWorkers:policy.max_workers,
      scaleInEnabled:policy.scale_in_enabled,
      lastActionAt:recent?.created_at||null,
      cooldownSeconds:policy.cooldown_seconds
    });

    const cost=costScore({
      workers:decision.action==="HOLD"
        ?Number(currentWorkers)
        :Number(desiredWorkers),
      unitCost,
      budget
    });

    const finalDecision=
      cost.withinBudget
        ?decision
        :{action:"HOLD",reason:"Capacity exceeds cost budget"};

    const {rows}=await pool.query(`
      INSERT INTO scaling_actions
        (consumer_group,action,current_workers,
         requested_workers,reason,cost_score)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      consumerGroup,
      finalDecision.action,
      Number(currentWorkers),
      Number(desiredWorkers),
      finalDecision.reason,
      cost.score
    ]);

    res.status(201).json({
      action:rows[0],
      cost
    });
  }catch{
    res.status(500).json({error:"Could not create scaling plan"});
  }
});

app.post("/api/autoscaling/actions/:id/approve",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      UPDATE scaling_actions
      SET approval_status='APPROVED'
      WHERE id=$1 AND approval_status='PENDING'
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({
        error:"Action not found or already decided"
      });

    res.json({action:rows[0]});
  }catch{
    res.status(500).json({error:"Could not approve action"});
  }
});

app.post("/api/autoscaling/actions/:id/apply",async(req,res)=>{
  try{
    const action=(await pool.query(`
      SELECT *
      FROM scaling_actions
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!action)
      return res.status(404).json({error:"Action not found"});

    if(action.approval_status!=="APPROVED")
      return res.status(403).json({
        error:"Scaling action requires approval"
      });

    if(action.action==="HOLD")
      return res.json({
        action,
        applied:false,
        reason:"HOLD action"
      });

    const result=await adapter.applyCapacity(
      action.consumer_group,
      action.requested_workers
    );

    const {rows}=await pool.query(`
      UPDATE scaling_actions
      SET execution_status='APPLIED',
          applied_workers=$2,
          applied_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[action.id,result.workers]);

    res.json({
      action:rows[0],
      adapterResult:result
    });
  }catch{
    res.status(500).json({error:"Could not apply scaling action"});
  }
});

app.post("/api/autoscaling/actions/:id/rollback",async(req,res)=>{
  try{
    const action=(await pool.query(`
      SELECT *
      FROM scaling_actions
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!action)
      return res.status(404).json({error:"Action not found"});

    if(action.applied_workers===null)
      return res.status(400).json({
        error:"No applied capacity to roll back"
      });

    const result=await adapter.rollbackCapacity(
      action.consumer_group,
      action.current_workers
    );

    const {rows}=await pool.query(`
      UPDATE scaling_actions
      SET execution_status='ROLLED_BACK',
          rolled_back_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[action.id]);

    res.json({
      action:rows[0],
      adapterResult:result
    });
  }catch{
    res.status(500).json({error:"Could not roll back action"});
  }
});

app.get("/api/autoscaling/operations",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM scaling_actions
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({actions:rows});
  }catch{
    res.status(500).json({error:"Could not load operations"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 72 Autoscaling Controller API running"
));


module.exports = app;
