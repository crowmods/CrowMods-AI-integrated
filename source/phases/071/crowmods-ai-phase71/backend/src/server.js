const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  scalingRecommendation,
  recoveryHealthy
}=require("./scaling");
const {incidentPayload}=require("./incident-bridge");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:71,
  service:"capacity-recovery"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/capacity/policies",async(req,res)=>{
  const {
    consumerGroup,
    minWorkers=1,
    maxWorkers=20,
    targetLag=100,
    scaleStep=1
  }=req.body||{};

  if(!consumerGroup)
    return res.status(400).json({
      error:"consumerGroup is required"
    });

  if(minWorkers<1||maxWorkers<minWorkers||scaleStep<1)
    return res.status(400).json({
      error:"Invalid worker bounds"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO capacity_policies
        (consumer_group,min_workers,max_workers,target_lag,scale_step)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(consumer_group)
      DO UPDATE SET
        min_workers=EXCLUDED.min_workers,
        max_workers=EXCLUDED.max_workers,
        target_lag=EXCLUDED.target_lag,
        scale_step=EXCLUDED.scale_step,
        enabled=true
      RETURNING *
    `,[
      consumerGroup,
      minWorkers,
      maxWorkers,
      targetLag,
      scaleStep
    ]);

    res.status(201).json({policy:rows[0]});
  }catch{
    res.status(500).json({error:"Could not save capacity policy"});
  }
});

app.get("/api/capacity/policies",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM capacity_policies
      WHERE enabled=true
      ORDER BY consumer_group
    `);

    res.json({policies:rows});
  }catch{
    res.status(500).json({error:"Could not load capacity policies"});
  }
});

app.post("/api/capacity/recommend",async(req,res)=>{
  const {
    consumerGroup,
    currentWorkers,
    lag
  }=req.body||{};

  if(!consumerGroup||
     currentWorkers===undefined||
     lag===undefined)
    return res.status(400).json({
      error:"consumerGroup, currentWorkers and lag are required"
    });

  try{
    const policy=(await pool.query(`
      SELECT *
      FROM capacity_policies
      WHERE consumer_group=$1 AND enabled=true
    `,[consumerGroup])).rows[0];

    if(!policy)
      return res.status(404).json({
        error:"Capacity policy not found"
      });

    const recommendation=scalingRecommendation({
      currentWorkers,
      lag,
      targetLag:policy.target_lag,
      minWorkers:policy.min_workers,
      maxWorkers:policy.max_workers,
      scaleStep:policy.scale_step
    });

    const {rows}=await pool.query(`
      INSERT INTO scaling_recommendations
        (consumer_group,current_workers,desired_workers,
         lag_value,target_lag,action,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      consumerGroup,
      Number(currentWorkers),
      recommendation.desiredWorkers,
      Number(lag),
      policy.target_lag,
      recommendation.action,
      recommendation.reason
    ]);

    res.json({
      recommendation:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create scaling recommendation"
    });
  }
});

app.post("/api/capacity/lag-incident",async(req,res)=>{
  const {
    consumerGroup,
    lag,
    threshold,
    severity="HIGH"
  }=req.body||{};

  if(!consumerGroup||lag===undefined||threshold===undefined)
    return res.status(400).json({
      error:"consumerGroup, lag and threshold are required"
    });

  res.status(202).json({
    incidentRequest:incidentPayload({
      consumerGroup,
      lag,
      threshold,
      severity
    })
  });
});

app.post("/api/capacity/verify-recovery",async(req,res)=>{
  const {
    consumerGroup,
    incidentId=null,
    lagBefore,
    lagAfter,
    errorRate=0
  }=req.body||{};

  if(!consumerGroup||
     lagBefore===undefined||
     lagAfter===undefined)
    return res.status(400).json({
      error:"consumerGroup, lagBefore and lagAfter are required"
    });

  const result=recoveryHealthy({
    lagBefore,
    lagAfter,
    errorRate
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO recovery_verifications
        (consumer_group,incident_id,lag_before,lag_after,
         error_rate,healthy)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      consumerGroup,
      incidentId,
      Number(lagBefore),
      Number(lagAfter),
      Number(errorRate),
      result.healthy
    ]);

    res.json({
      verification:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not record recovery verification"
    });
  }
});

app.get("/api/capacity/operations",async(_req,res)=>{
  try{
    const [recommendations,recoveries]=await Promise.all([
      pool.query(`
        SELECT *
        FROM scaling_recommendations
        ORDER BY created_at DESC
        LIMIT 100
      `),
      pool.query(`
        SELECT *
        FROM recovery_verifications
        ORDER BY verified_at DESC
        LIMIT 100
      `)
    ]);

    res.json({
      recommendations:recommendations.rows,
      recoveries:recoveries.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load capacity operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 71 Capacity Recovery API running"
));
