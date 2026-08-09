const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  hysteresisDecision,
  verificationResult
}=require("./hysteresis");

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
  phase:73,
  service:"capacity-verification"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/telemetry/capacity",async(req,res)=>{
  const {
    consumerGroup,
    workers,
    lag,
    throughput=0,
    errorRate=0,
    cpuUtilization=null,
    memoryUtilization=null
  }=req.body||{};

  if(!consumerGroup||
     workers===undefined||
     lag===undefined)
    return res.status(400).json({
      error:"consumerGroup, workers and lag are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO capacity_telemetry
        (consumer_group,workers,lag,throughput,error_rate,
         cpu_utilization,memory_utilization)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      consumerGroup,
      Number(workers),
      Number(lag),
      Number(throughput),
      Number(errorRate),
      cpuUtilization===null?null:Number(cpuUtilization),
      memoryUtilization===null?null:Number(memoryUtilization)
    ]);

    res.status(201).json({telemetry:rows[0]});
  }catch{
    res.status(500).json({error:"Could not ingest telemetry"});
  }
});

app.get("/api/telemetry/capacity/:group",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM capacity_telemetry
      WHERE consumer_group=$1
      ORDER BY observed_at DESC
      LIMIT 100
    `,[req.params.group]);

    res.json({telemetry:rows});
  }catch{
    res.status(500).json({error:"Could not load telemetry"});
  }
});

app.post("/api/autoscaling/hysteresis",async(req,res)=>{
  const {
    consumerGroup,
    lag,
    currentWorkers,
    scaleOutThreshold=500,
    scaleInThreshold=100,
    minWorkers=1,
    maxWorkers=20,
    scaleStep=1,
    scaleInEnabled=true
  }=req.body||{};

  if(!consumerGroup||
     lag===undefined||
     currentWorkers===undefined)
    return res.status(400).json({
      error:"consumerGroup, lag and currentWorkers are required"
    });

  const decision=hysteresisDecision({
    lag,
    scaleOutThreshold,
    scaleInThreshold,
    currentWorkers,
    minWorkers,
    maxWorkers,
    scaleStep,
    scaleInEnabled
  });

  try{
    await pool.query(`
      INSERT INTO scaling_state
        (consumer_group,state,last_transition_at)
      VALUES($1,$2,NOW())
      ON CONFLICT(consumer_group)
      DO UPDATE SET
        state=EXCLUDED.state,
        last_transition_at=NOW()
    `,[
      consumerGroup,
      decision.action==="SCALE_OUT"
        ?"SCALING_OUT"
        :decision.action==="SCALE_IN"
          ?"SCALING_IN"
          :"STABLE"
    ]);

    res.json({decision});
  }catch{
    res.status(500).json({
      error:"Could not record scaling state"
    });
  }
});

app.post("/api/autoscaling/verify",async(req,res)=>{
  const {
    scalingActionId,
    expectedWorkers,
    observedWorkers,
    lagBefore,
    lagAfter,
    errorRate=0,
    maxErrorRate=.02
  }=req.body||{};

  if(!scalingActionId||
     expectedWorkers===undefined||
     observedWorkers===undefined||
     lagBefore===undefined||
     lagAfter===undefined)
    return res.status(400).json({
      error:"Scaling action and verification metrics are required"
    });

  const result=verificationResult({
    expectedWorkers,
    observedWorkers,
    lagBefore,
    lagAfter,
    errorRate,
    maxErrorRate
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO scaling_verification_runs
        (scaling_action_id,expected_workers,observed_workers,
         lag_before,lag_after,error_rate,status,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `,[
      scalingActionId,
      Number(expectedWorkers),
      Number(observedWorkers),
      Number(lagBefore),
      Number(lagAfter),
      Number(errorRate),
      result.status,
      result.reason
    ]);

    res.json({
      verification:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not record scaling verification"
    });
  }
});

app.get("/api/autoscaling/state/:group",async(req,res)=>{
  try{
    const state=(await pool.query(`
      SELECT *
      FROM scaling_state
      WHERE consumer_group=$1
    `,[req.params.group])).rows[0];

    res.json({state:state||null});
  }catch{
    res.status(500).json({error:"Could not load scaling state"});
  }
});

app.get("/api/autoscaling/verification",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM scaling_verification_runs
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({verifications:rows});
  }catch{
    res.status(500).json({
      error:"Could not load verification runs"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 73 Capacity Verification API running"
));
