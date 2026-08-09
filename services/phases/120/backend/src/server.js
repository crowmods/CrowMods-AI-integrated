const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  createEnvelope,
  verifyEnvelope
}=require("./fencing-envelope");
const {
  transition
}=require("./canary-orchestrator");
const {
  scheduleDelegation,
  claimJob
}=require("./delegation-scheduler");
const {
  calculatePredictionIntervals,
  empiricalCoverage
}=require("./forecast-interval");
const {
  ProductionKmsVerifier
}=require("./kms-verifier");

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

class ConfiguredSigner{
  constructor(){
    this.algorithm="KMS-DELEGATED";
    this.keyVersion=
      process.env.GOVERNANCE_KEY_VERSION||
      "configured-key";
  }
  sign(value){
    const signer=process.env.SIGN_DIGEST;
    if(!signer)
      throw new Error("kms_signing_adapter_required");
    return signer(value);
  }
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:120
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/fencing/envelope",
async(req,res)=>{
  try{
    const result=createEnvelope({
      resourceKey:req.body?.resourceKey,
      tokenVersion:Number(
        req.body?.tokenVersion
      ),
      payload:req.body?.payload,
      expiresAt:req.body?.expiresAt,
      signer:new ConfiguredSigner()
    });

    res.json(result);
  }catch{
    res.status(503).json({
      status:"BLOCKED",
      reason:"production_signing_adapter_required"
    });
  }
});

app.post("/api/security/fencing/envelope/verify",
async(req,res)=>{
  const verifier=new ProductionKmsVerifier({
    provider:req.body?.provider,
    keyReference:req.body?.keyReference,
    client:req.body?.client
  });

  let result;

  try{
    const signatureResult=
      await verifier.verifyDigest({
        digest:req.body?.envelope?.envelopeDigest,
        signature:req.body?.envelope?.signature,
        algorithm:req.body?.envelope?.algorithm
      });

    if(signatureResult.status!=="VALID")
      return res.json({
        valid:false,
        reason:
          signatureResult.status
      });

    result=verifyEnvelope({
      envelope:req.body?.envelope,
      payload:req.body?.payload,
      expectedResourceKey:
        req.body?.expectedResourceKey,
      expectedTokenVersion:
        Number(req.body?.expectedTokenVersion),
      verifier:{
        verify:()=>true
      },
      now:req.body?.now||new Date()
    });
  }catch{
    result={
      valid:false,
      reason:"kms_verification_error"
    };
  }

  res.json(result);
});

app.post("/api/security/canary/transition",
async(req,res)=>{
  const result=transition({
    stage:req.body?.stage,
    checks:req.body?.checks||{},
    trafficPercent:
      Number(req.body?.trafficPercent)||1,
    errorRate:
      Number(req.body?.errorRate)||0,
    latencyRegression:
      Number(req.body?.latencyRegression)||0,
    thresholds:req.body?.thresholds
  });

  try{
    await pool.query(`
      INSERT INTO canary_rollouts
        (rollout_key,stage,traffic_percent,
         error_rate,latency_regression,reason)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(rollout_key)
      DO UPDATE SET
        stage=EXCLUDED.stage,
        traffic_percent=EXCLUDED.traffic_percent,
        error_rate=EXCLUDED.error_rate,
        latency_regression=EXCLUDED.latency_regression,
        reason=EXCLUDED.reason,
        updated_at=NOW()
    `,[
      req.body?.rolloutKey,
      result.stage,
      result.trafficPercent||
        Number(req.body?.trafficPercent)||0,
      Number(req.body?.errorRate)||0,
      Number(req.body?.latencyRegression)||0,
      result.reason||null
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/delegation/schedule",
async(req,res)=>{
  const result=scheduleDelegation({
    delegationId:req.body?.delegationId,
    scheduledFor:req.body?.scheduledFor,
    runKey:req.body?.runKey
  });

  if(result.status==="SCHEDULED"){
    try{
      await pool.query(`
        INSERT INTO delegation_scheduler_jobs
          (delegation_id,run_key,
           scheduled_for,status)
        VALUES($1,$2,$3,'SCHEDULED')
        ON CONFLICT(run_key) DO NOTHING
      `,[
        result.delegationId,
        result.runKey,
        result.scheduledFor
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/delegation/claim",
async(req,res)=>{
  const result=claimJob({
    job:req.body?.job,
    workerId:req.body?.workerId,
    now:req.body?.now||new Date()
  });

  res.json(result);
});

app.post("/api/security/risk/interval",
async(req,res)=>{
  const result=calculatePredictionIntervals({
    residuals:req.body?.residuals||[],
    projectedScore:Number(
      req.body?.projectedScore
    ),
    horizonPeriods:
      Number(req.body?.horizonPeriods)||4,
    coverageTarget:
      Number(req.body?.coverageTarget)||.95
  });

  if(result.status==="CALCULATED"){
    try{
      await pool.query(`
        INSERT INTO forecast_interval_runs
          (sample_count,horizon_periods,
           coverage_target,interval_width)
        VALUES($1,$2,$3,$4)
      `,[
        (req.body?.residuals||[]).length,
        result.horizonPeriods,
        result.coverageTarget,
        result.intervalWidth
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk/interval/coverage",
(req,res)=>{
  res.json({
    empiricalCoverage:
      empiricalCoverage({
        predictions:req.body?.predictions||[],
        actuals:req.body?.actuals||[],
        bounds:req.body?.bounds||[]
      })
  });
});

app.post("/api/security/governance/kms/verify",
async(req,res)=>{
  const verifier=new ProductionKmsVerifier({
    provider:req.body?.provider,
    keyReference:req.body?.keyReference,
    client:req.body?.client
  });

  let result;

  try{
    result=await verifier.verifyDigest({
      digest:req.body?.digest,
      signature:req.body?.signature,
      algorithm:req.body?.algorithm
    });
  }catch{
    result={
      status:"INVALID",
      reason:"verification_error"
    };
  }

  try{
    await pool.query(`
      INSERT INTO kms_verification_events
        (provider,key_reference,algorithm,
         verification_result,digest)
      VALUES($1,$2,$3,$4,$5)
    `,[
      req.body?.provider||"unknown",
      req.body?.keyReference||"unknown",
      req.body?.algorithm||"unknown",
      result.status,
      req.body?.digest||""
    ]);
  }catch{}

  res.json(result);
});

app.get("/api/security/production-assurance-dashboard",
async(_req,res)=>{
  try{
    const [blocked,rollouts,
           scheduler,coverage,kms]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM fencing_envelopes
          WHERE status='ACTIVE'
          AND expires_at>NOW()
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM canary_rollouts
          WHERE stage='PROMOTED'
          AND updated_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM delegation_scheduler_jobs
          WHERE status IN ('SCHEDULED','CLAIMED')
        `),
        pool.query(`
          SELECT empirical_coverage,
                 interval_width
          FROM forecast_interval_runs
          ORDER BY created_at DESC
          LIMIT 1
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM kms_verification_events
          WHERE verification_result='VALID'
          AND created_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      activeFencingEnvelopes:
        blocked.rows[0].count,
      promotedRollouts30d:
        rollouts.rows[0].count,
      pendingDelegationJobs:
        scheduler.rows[0].count,
      latestForecastInterval:
        coverage.rows[0]||null,
      validKmsVerifications30d:
        kms.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load production assurance dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 120 Production Assurance API running"
));


module.exports = app;
