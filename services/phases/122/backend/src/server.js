const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {validateSerializableCommit}=require("./serializable-fencing");
const {adaptiveCanary}=require("./adaptive-canary");
const {renewLease}=require("./lease-heartbeat");
const {calibrateConformal,detectDrift}=require("./conformal-calibration");
const {AwsKmsIntegration,AzureKmsIntegration,GcpKmsIntegration}=require("./kms-integrations");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

function kms(provider,client){
  if(provider==="AWS_KMS") return new AwsKmsIntegration(client);
  if(provider==="AZURE_KEY_VAULT") return new AzureKmsIntegration(client);
  if(provider==="GCP_KMS") return new GcpKmsIntegration(client);
  return null;
}

app.get("/health",(_req,res)=>res.json({status:"healthy",phase:122}));

app.get("/ready",async(_req,res)=>{
  try{await pool.query("SELECT 1");res.json({ready:true});}
  catch{res.status(503).json({ready:false});}
});

app.post("/api/security/fencing/serializable",async(req,res)=>{
  const r=validateSerializableCommit({
    resourceKey:req.body?.resourceKey,
    expectedResourceKey:req.body?.expectedResourceKey,
    observedVersion:Number(req.body?.observedVersion),
    currentVersion:Number(req.body?.currentVersion),
    nextVersion:Number(req.body?.nextVersion),
    payloadDigest:req.body?.payloadDigest,
    expectedPayloadDigest:req.body?.expectedPayloadDigest
  });
  try{
    await pool.query(`INSERT INTO serializable_fencing_events
      (resource_key,observed_version,committed_version,result,reason)
      VALUES($1,$2,$3,$4,$5)`,[
      req.body?.resourceKey||"unknown",
      Number(req.body?.observedVersion)||0,
      r.committedVersion||null,
      r.status,
      r.reason||null
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/canary/adaptive",async(req,res)=>{
  const r=adaptiveCanary({
    currentTraffic:Number(req.body?.currentTraffic),
    errorRate:Number(req.body?.errorRate)||0,
    latencyRegression:Number(req.body?.latencyRegression)||0,
    maxErrorRate:Number(req.body?.maxErrorRate)||5,
    maxLatencyRegression:Number(req.body?.maxLatencyRegression)||20,
    minStep:Number(req.body?.minStep)||1,
    maxStep:Number(req.body?.maxStep)||25,
    maxTraffic:Number(req.body?.maxTraffic)||100
  });
  try{
    await pool.query(`INSERT INTO adaptive_canary_decisions
      (rollout_key,current_traffic,next_traffic,decision,reason)
      VALUES($1,$2,$3,$4,$5)`,[
      req.body?.rolloutKey||"unknown",
      Number(req.body?.currentTraffic)||0,
      r.nextTraffic||0,
      r.decision,
      r.reason
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/delegation/heartbeat",async(req,res)=>{
  const r=renewLease({
    status:req.body?.status,
    runKey:req.body?.runKey,
    workerId:req.body?.workerId,
    leaseToken:req.body?.leaseToken,
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    extensionSeconds:Number(req.body?.extensionSeconds)||300
  });
  try{
    await pool.query(`INSERT INTO delegation_lease_heartbeats
      (run_key,worker_id,lease_token,previous_expiry,new_expiry,result)
      VALUES($1,$2,$3,$4,$5,$6)`,[
      req.body?.runKey||"unknown",
      req.body?.workerId||"unknown",
      req.body?.leaseToken||"unknown",
      req.body?.leaseExpiresAt||new Date(),
      r.newExpiry||req.body?.leaseExpiresAt||new Date(),
      r.status
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/risk/conformal",async(req,res)=>{
  const r=calibrateConformal({
    residuals:req.body?.residuals||[],
    coverageTarget:Number(req.body?.coverageTarget)||.9,
    actuals:req.body?.actuals||[],
    predictions:req.body?.predictions||[]
  });
  if(r.status==="CALIBRATED"){
    try{
      await pool.query(`INSERT INTO conformal_calibration_runs
        (sample_count,coverage_target,nonconformity_quantile,empirical_coverage)
        VALUES($1,$2,$3,$4)`,[
        r.sampleCount,r.coverageTarget,
        r.nonconformityQuantile,r.empiricalCoverage
      ]);
    }catch{}
  }
  res.json(r);
});

app.post("/api/security/risk/drift",async(req,res)=>{
  const r=detectDrift({
    baselineErrors:req.body?.baselineErrors||[],
    recentErrors:req.body?.recentErrors||[],
    watchRatio:Number(req.body?.watchRatio)||1.25,
    driftRatio:Number(req.body?.driftRatio)||1.75
  });
  try{
    await pool.query(`INSERT INTO forecast_drift_events
      (baseline_error,recent_error,drift_ratio,status)
      VALUES($1,$2,$3,$4)`,[
      r.baselineError||0,r.recentError||0,r.driftRatio||0,r.status
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/kms/sign",async(req,res)=>{
  const adapter=kms(req.body?.provider,req.body?.client);
  if(!adapter)
    return res.status(400).json({status:"BLOCKED",reason:"unsupported_provider"});
  const r=await adapter.sign({
    keyReference:req.body?.keyReference,
    digest:req.body?.digest,
    algorithm:req.body?.algorithm
  });
  try{
    await pool.query(`INSERT INTO kms_provider_events
      (provider,operation,integration_version,status)
      VALUES($1,'SIGN',$2,$3)`,[
      r.provider||req.body?.provider,
      r.integrationVersion||"unknown",
      r.status
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/kms/verify",async(req,res)=>{
  const adapter=kms(req.body?.provider,req.body?.client);
  if(!adapter)
    return res.status(400).json({status:"BLOCKED",reason:"unsupported_provider"});
  const r=await adapter.verify({
    keyReference:req.body?.keyReference,
    digest:req.body?.digest,
    signature:req.body?.signature,
    algorithm:req.body?.algorithm
  });
  try{
    await pool.query(`INSERT INTO kms_provider_events
      (provider,operation,integration_version,status)
      VALUES($1,'VERIFY',$2,$3)`,[
      r.provider||req.body?.provider,
      r.integrationVersion||"unknown",
      r.status
    ]);
  }catch{}
  res.json(r);
});

app.get("/api/security/phase122-dashboard",async(_req,res)=>{
  try{
    const [fencing,canary,leases,calibration,drift,kms]=await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM serializable_fencing_events
        WHERE result='ABORTED' AND created_at>NOW()-INTERVAL '30 days'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM adaptive_canary_decisions
        WHERE decision='ROLLBACK' AND created_at>NOW()-INTERVAL '30 days'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM delegation_lease_heartbeats
        WHERE result='RENEWED' AND created_at>NOW()-INTERVAL '24 hours'`),
      pool.query(`SELECT empirical_coverage,nonconformity_quantile
        FROM conformal_calibration_runs ORDER BY created_at DESC LIMIT 1`),
      pool.query(`SELECT status,drift_ratio FROM forecast_drift_events
        ORDER BY created_at DESC LIMIT 1`),
      pool.query(`SELECT COUNT(*)::int AS count FROM kms_provider_events
        WHERE status='SUCCESS' AND created_at>NOW()-INTERVAL '30 days'`)
    ]);
    res.json({
      abortedFencingTransactions30d:fencing.rows[0].count,
      canaryRollbacks30d:canary.rows[0].count,
      leaseRenewals24h:leases.rows[0].count,
      latestConformalCalibration:calibration.rows[0]||null,
      latestForecastDrift:drift.rows[0]||null,
      successfulKmsOperations30d:kms.rows[0].count
    });
  }catch{
    res.status(500).json({error:"Could not load Phase 122 dashboard"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 122 API running"));


module.exports = app;
