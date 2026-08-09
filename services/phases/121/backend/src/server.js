const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  payloadDigest,
  verifyTransaction
}=require("./transactional-fencing");
const {
  nextTrafficStage
}=require("./canary-traffic");
const {
  claimQueueJob
}=require("./queue-claim");
const {
  calibrateQuantiles,
  intervalCoverage
}=require("./quantile-calibration");
const {
  AwsKmsAdapter,
  AzureKeyVaultAdapter,
  GcpKmsAdapter
}=require("./cloud-kms");

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

function cloudAdapter(provider,client){
  if(provider==="AWS_KMS")
    return new AwsKmsAdapter(client);
  if(provider==="AZURE_KEY_VAULT")
    return new AzureKeyVaultAdapter(client);
  if(provider==="GCP_KMS")
    return new GcpKmsAdapter(client);
  return null;
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:121
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/fencing/transaction",
async(req,res)=>{
  const result=verifyTransaction({
    resourceKey:req.body?.resourceKey,
    expectedResourceKey:
      req.body?.expectedResourceKey,
    tokenVersion:Number(
      req.body?.tokenVersion
    ),
    currentTokenVersion:Number(
      req.body?.currentTokenVersion
    ),
    tokenActive:req.body?.tokenActive,
    payload:req.body?.payload,
    expectedPayloadDigest:
      req.body?.expectedPayloadDigest
  });

  try{
    await pool.query(`
      INSERT INTO fencing_transactions
        (resource_key,token_version,
         payload_digest,verification_result,reason)
      VALUES($1,$2,$3,$4,$5)
    `,[
      req.body?.resourceKey||"unknown",
      Number(req.body?.tokenVersion)||0,
      payloadDigest(req.body?.payload||{}),
      result.accepted?"ACCEPTED":"BLOCKED",
      result.reason||null
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/canary/traffic",
async(req,res)=>{
  const result=nextTrafficStage({
    currentPercent:Number(
      req.body?.currentPercent
    ),
    stages:req.body?.stages,
    health:{
      errorRate:Number(
        req.body?.errorRate
      )||0,
      latencyRegression:Number(
        req.body?.latencyRegression
      )||0,
      maxErrorRate:Number(
        req.body?.maxErrorRate
      )||5,
      maxLatencyRegression:Number(
        req.body?.maxLatencyRegression
      )||20
    }
  });

  if(result.status==="ADVANCE"){
    try{
      await pool.query(`
        INSERT INTO canary_traffic_stages
          (rollout_key,stage_name,
           traffic_percent,status)
        VALUES($1,$2,$3,'ACTIVE')
        ON CONFLICT(rollout_key,stage_name)
        DO UPDATE SET
          traffic_percent=EXCLUDED.traffic_percent,
          status='ACTIVE'
      `,[
        req.body?.rolloutKey,
        `${result.trafficPercent}%`,
        result.trafficPercent
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/delegation/queue-claim",
async(req,res)=>{
  const result=claimQueueJob({
    job:req.body?.job,
    workerId:req.body?.workerId,
    now:req.body?.now||new Date(),
    leaseSeconds:
      Number(req.body?.leaseSeconds)||300
  });

  if(result.status==="CLAIMED"){
    try{
      await pool.query(`
        INSERT INTO delegation_queue_claims
          (run_key,delegation_id,
           worker_id,lease_token,
           claimed_at,lease_expires_at,status)
        VALUES($1,$2,$3,$4,$5,$6,'CLAIMED')
        ON CONFLICT(run_key) DO NOTHING
      `,[
        result.runKey,
        req.body?.job?.delegationId||null,
        result.workerId,
        result.leaseToken,
        result.claimedAt,
        result.leaseExpiresAt
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk/quantile-calibration",
async(req,res)=>{
  const result=calibrateQuantiles({
    residuals:req.body?.residuals||[],
    lowerQuantile:
      Number(req.body?.lowerQuantile)||
      .05,
    upperQuantile:
      Number(req.body?.upperQuantile)||
      .95
  });

  if(result.status==="CALIBRATED"){
    const coverage=intervalCoverage({
      actuals:req.body?.actuals||[],
      predictions:req.body?.predictions||[],
      lowerError:result.lowerError,
      upperError:result.upperError
    });

    try{
      await pool.query(`
        INSERT INTO forecast_quantile_calibration
          (sample_count,lower_quantile,
           upper_quantile,lower_error,
           upper_error,coverage)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        result.sampleCount,
        result.lowerQuantile,
        result.upperQuantile,
        result.lowerError,
        result.upperError,
        coverage
      ]);
    }catch{}

    return res.json({
      ...result,
      coverage
    });
  }

  res.json(result);
});

app.post("/api/security/kms/sign",
async(req,res)=>{
  const adapter=cloudAdapter(
    req.body?.provider,
    req.body?.client
  );

  if(!adapter)
    return res.status(400).json({
      status:"BLOCKED",
      reason:"unsupported_kms_provider"
    });

  let result;

  try{
    result=await adapter.sign({
      keyReference:req.body?.keyReference,
      digest:req.body?.digest,
      algorithm:req.body?.algorithm
    });
  }catch{
    result={
      status:"FAILED",
      provider:req.body?.provider
    };
  }

  try{
    await pool.query(`
      INSERT INTO kms_adapter_events
        (provider,operation,
         key_reference,algorithm,status)
      VALUES($1,'SIGN',$2,$3,$4)
    `,[
      req.body.provider,
      req.body.keyReference||"unknown",
      req.body.algorithm||"unknown",
      result.status
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/kms/verify",
async(req,res)=>{
  const adapter=cloudAdapter(
    req.body?.provider,
    req.body?.client
  );

  if(!adapter)
    return res.status(400).json({
      status:"BLOCKED",
      reason:"unsupported_kms_provider"
    });

  let result;

  try{
    result=await adapter.verify({
      keyReference:req.body?.keyReference,
      digest:req.body?.digest,
      signature:req.body?.signature,
      algorithm:req.body?.algorithm
    });
  }catch{
    result={
      status:"FAILED",
      provider:req.body?.provider
    };
  }

  try{
    await pool.query(`
      INSERT INTO kms_adapter_events
        (provider,operation,
         key_reference,algorithm,status)
      VALUES($1,'VERIFY',$2,$3,$4)
    `,[
      req.body.provider,
      req.body.keyReference||"unknown",
      req.body.algorithm||"unknown",
      result.status
    ]);
  }catch{}

  res.json(result);
});

app.get("/api/security/phase121-dashboard",
async(_req,res)=>{
  try{
    const [fencing,canary,
           claims,forecast,kms]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM fencing_transactions
          WHERE verification_result='BLOCKED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM canary_traffic_stages
          WHERE status='ACTIVE'
          AND entered_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM delegation_queue_claims
          WHERE status='CLAIMED'
          AND lease_expires_at>NOW()
        `),
        pool.query(`
          SELECT coverage,interval_width
          FROM forecast_quantile_calibration
          ORDER BY created_at DESC
          LIMIT 1
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM kms_adapter_events
          WHERE status='SUCCESS'
          AND created_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      blockedFencingTransactions30d:
        fencing.rows[0].count,
      activeCanaryStages24h:
        canary.rows[0].count,
      activeDelegationClaims:
        claims.rows[0].count,
      latestForecastCalibration:
        forecast.rows[0]||null,
      successfulKmsOperations30d:
        kms.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 121 dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 121 Cloud Assurance API running"
));


module.exports = app;
