const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  sampleHealthy,
  confidenceScore,
  recoveryState
}=require("./recovery");

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
  phase:74,
  service:"recovery-automation"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/recovery/windows",async(req,res)=>{
  const {
    scalingActionId,
    durationSeconds=300
  }=req.body||{};

  if(!scalingActionId)
    return res.status(400).json({
      error:"scalingActionId is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO stabilization_windows
        (scaling_action_id,duration_seconds,ends_at)
      VALUES(
        $1,
        $2,
        NOW()+($2 * INTERVAL '1 second')
      )
      RETURNING *
    `,[scalingActionId,Number(durationSeconds)]);

    res.status(201).json({window:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create stabilization window"
    });
  }
});

app.post("/api/recovery/samples",async(req,res)=>{
  const {
    scalingActionId,
    workers,
    expectedWorkers,
    lag,
    previousLag,
    errorRate=0,
    throughput=0,
    maxErrorRate=.02
  }=req.body||{};

  if(!scalingActionId||
     workers===undefined||
     expectedWorkers===undefined||
     lag===undefined||
     previousLag===undefined)
    return res.status(400).json({
      error:"Scaling action and sample metrics are required"
    });

  const healthy=sampleHealthy({
    workers,
    expectedWorkers,
    lag,
    previousLag,
    errorRate,
    maxErrorRate
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO verification_samples
        (scaling_action_id,workers,lag,error_rate,
         throughput,healthy)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      scalingActionId,
      Number(workers),
      Number(lag),
      Number(errorRate),
      Number(throughput),
      healthy
    ]);

    res.status(201).json({sample:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not record verification sample"
    });
  }
});

app.post("/api/recovery/evaluate/:actionId",async(req,res)=>{
  const actionId=req.params.actionId;

  const {
    requiredHealthySamples=3,
    maxUnhealthySamples=2,
    minimumConfidence=.8
  }=req.body||{};

  try{
    const samples=(await pool.query(`
      SELECT *
      FROM verification_samples
      WHERE scaling_action_id=$1
      ORDER BY observed_at ASC
    `,[actionId])).rows;

    const healthySamples=samples.filter(s=>s.healthy).length;
    const unhealthySamples=samples.length-healthySamples;

    const confidence=confidenceScore({
      healthySamples,
      unhealthySamples,
      minimumSamples:
        requiredHealthySamples+maxUnhealthySamples
    });

    const state=recoveryState({
      healthySamples,
      unhealthySamples,
      confidence,
      requiredHealthySamples,
      maxUnhealthySamples,
      minimumConfidence
    });

    const {rows}=await pool.query(`
      INSERT INTO recovery_runs
        (scaling_action_id,healthy_samples,unhealthy_samples,
         confidence,state,closure_eligible)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      actionId,
      healthySamples,
      unhealthySamples,
      confidence,
      state.state,
      state.closureEligible
    ]);

    res.json({
      evaluation:rows[0],
      sampleCount:samples.length
    });
  }catch{
    res.status(500).json({
      error:"Could not evaluate recovery"
    });
  }
});

app.get("/api/recovery/runs",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM recovery_runs
      ORDER BY updated_at DESC
      LIMIT 100
    `);

    res.json({runs:rows});
  }catch{
    res.status(500).json({
      error:"Could not load recovery runs"
    });
  }
});

app.get("/api/recovery/closure/:actionId",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM recovery_runs
      WHERE scaling_action_id=$1
      ORDER BY updated_at DESC
      LIMIT 1
    `,[req.params.actionId]);

    res.json({
      actionId:req.params.actionId,
      closureEligible:Boolean(rows[0]?.closure_eligible),
      state:rows[0]?.state||"VERIFYING",
      confidence:Number(rows[0]?.confidence||0)
    });
  }catch{
    res.status(500).json({
      error:"Could not evaluate closure eligibility"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 74 Recovery Automation API running"
));


module.exports = app;
