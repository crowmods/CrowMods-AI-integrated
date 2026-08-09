const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  buildFencingHeaders,
  validateDownstreamFencing
}=require("./downstream-fencing");
const {
  decideCanaryRollout
}=require("./canary-rollback");
const {
  processDelegations
}=require("./delegation-worker");
const {
  calibrateForecasts
}=require("./forecast-calibration");
const {
  ProductionKmsSigner
}=require("./kms-signer");
const {
  createDigest
}=require("./governance-bundle");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"
    ?{rejectUnauthorized:true}
    :false
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:119
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/fencing/propagate",
async(req,res)=>{
  const result=buildFencingHeaders({
    resourceKey:req.body?.resourceKey,
    tokenVersion:Number(
      req.body?.tokenVersion
    ),
    token:req.body?.token
  });

  res.json(result);
});

app.post("/api/security/fencing/downstream-check",
async(req,res)=>{
  const result=validateDownstreamFencing({
    expectedResource:
      req.body?.expectedResource,
    expectedVersion:Number(
      req.body?.expectedVersion
    ),
    resourceKey:req.body?.resourceKey,
    tokenVersion:Number(
      req.body?.tokenVersion
    ),
    tokenValid:req.body?.tokenValid
  });

  try{
    await pool.query(`
      INSERT INTO downstream_fencing_events
        (resource_key,token_version,
         downstream,result,reason)
      VALUES($1,$2,$3,$4,$5)
    `,[
      req.body?.resourceKey||"unknown",
      Number(req.body?.tokenVersion)||0,
      req.body?.downstream||"unknown",
      result.accepted?"ACCEPTED":"BLOCKED",
      result.reason||null
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/canary/rollout",
async(req,res)=>{
  const result=decideCanaryRollout({
    checks:req.body?.checks||{},
    errorRate:Number(
      req.body?.errorRate
    )||0,
    latencyRegression:Number(
      req.body?.latencyRegression
    )||0,
    rollbackThresholds:
      req.body?.rollbackThresholds
  });

  try{
    await pool.query(`
      INSERT INTO canary_rollout_decisions
        (canary_id,decision,reason,
         passed_checks,failed_checks)
      VALUES($1,$2,$3,$4,$5)
    `,[
      req.body?.canaryId||null,
      result.decision,
      result.reason,
      result.passedChecks||0,
      result.failedChecks?.length||0
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/delegation/worker-run",
async(req,res)=>{
  const started=new Date();
  const result=processDelegations({
    delegations:req.body?.delegations||[],
    now:req.body?.now||started
  });

  try{
    await pool.query(`
      INSERT INTO delegation_worker_runs
        (examined,revoked,skipped,
         run_status,started_at,completed_at)
      VALUES($1,$2,$3,$4,$5,NOW())
    `,[
      result.examined,
      result.revoked,
      result.skipped,
      result.status,
      started
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/risk/forecast-calibrate",
async(req,res)=>{
  const result=calibrateForecasts({
    predictions:req.body?.predictions||[],
    actuals:req.body?.actuals||[]
  });

  if(result.status==="CALIBRATED"){
    try{
      await pool.query(`
        INSERT INTO forecast_calibration_runs
          (sample_count,mean_absolute_error,
           bias,calibrated_confidence)
        VALUES($1,$2,$3,$4)
      `,[
        result.sampleCount,
        result.meanAbsoluteError,
        result.bias,
        result.calibratedConfidence
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/governance/kms-sign",
async(req,res)=>{
  const bundle=req.body?.bundle||{};
  const digest=createDigest(bundle);

  const signer=new ProductionKmsSigner({
    provider:req.body?.provider,
    keyReference:req.body?.keyReference,
    client:req.body?.client
  });

  let result;

  try{
    result=await signer.signDigest(digest);
  }catch{
    result={
      status:"FAILED",
      reason:"kms_signing_error"
    };
  }

  try{
    await pool.query(`
      INSERT INTO kms_signing_events
        (provider,key_reference,key_version,
         algorithm,digest,signature,status)
      VALUES($1,$2,$3,$4,$5,$6,$7)
    `,[
      req.body?.provider||"unknown",
      req.body?.keyReference||"unknown",
      result.keyVersion||null,
      result.algorithm||"unknown",
      digest,
      result.signature||null,
      result.status
    ]);
  }catch{}

  res.json({
    ...result,
    digest
  });
});

app.get("/api/security/production-governance-dashboard",
async(_req,res)=>{
  try{
    const [downstream,rollbacks,
           workerRuns,calibration,
           kms]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM downstream_fencing_events
        WHERE result='BLOCKED'
        AND created_at>NOW()-INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM canary_rollout_decisions
        WHERE decision='ROLLBACK'
        AND decided_at>NOW()-INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM delegation_worker_runs
        WHERE run_status='COMPLETED'
        AND started_at>NOW()-INTERVAL '24 hours'
      `),
      pool.query(`
        SELECT calibrated_confidence,
               mean_absolute_error,bias
        FROM forecast_calibration_runs
        ORDER BY created_at DESC
        LIMIT 1
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM kms_signing_events
        WHERE status='SIGNED'
        AND created_at>NOW()-INTERVAL '30 days'
      `)
    ]);

    res.json({
      blockedDownstreamFencing30d:
        downstream.rows[0].count,
      canaryRollbacks30d:
        rollbacks.rows[0].count,
      delegationWorkerRuns24h:
        workerRuns.rows[0].count,
      latestCalibration:
        calibration.rows[0]||null,
      kmsSignatures30d:
        kms.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load production governance dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 119 Production Governance API running"
));
