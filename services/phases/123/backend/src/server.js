const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {compareAndSwapFence}=require("./cas-fencing");
const {evaluateHysteresis}=require("./canary-hysteresis");
const {renewFencedLease}=require("./lease-fencing-renewal");
const {updateOnlineCalibration}=require("./online-calibration");
const {buildDriftAlert}=require("./drift-alerts");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({status:"healthy",phase:123}));

app.get("/ready",async(_req,res)=>{
  try{await pool.query("SELECT 1");res.json({ready:true});}
  catch{res.status(503).json({ready:false});}
});

app.post("/api/security/fencing/cas",async(req,res)=>{
  const r=compareAndSwapFence({
    resourceKey:req.body?.resourceKey,
    expectedResourceKey:req.body?.expectedResourceKey,
    storedVersion:Number(req.body?.storedVersion),
    expectedVersion:Number(req.body?.expectedVersion),
    nextVersion:Number(req.body?.nextVersion),
    payloadDigest:req.body?.payloadDigest,
    expectedPayloadDigest:req.body?.expectedPayloadDigest
  });
  try{
    await pool.query(`INSERT INTO fencing_cas_operations
      (resource_key,expected_version,committed_version,result,reason)
      VALUES($1,$2,$3,$4,$5)`,[
      req.body?.resourceKey||"unknown",
      Number(req.body?.expectedVersion)||0,
      r.committedVersion||null,
      r.status,
      r.reason||null
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/canary/hysteresis",async(req,res)=>{
  const r=evaluateHysteresis({
    healthScore:Number(req.body?.healthScore),
    consecutiveFailures:Number(req.body?.consecutiveFailures)||0,
    consecutiveSuccesses:Number(req.body?.consecutiveSuccesses)||0,
    rollbackThreshold:Number(req.body?.rollbackThreshold)||.35,
    recoveryThreshold:Number(req.body?.recoveryThreshold)||.8,
    rollbackFailures:Number(req.body?.rollbackFailures)||2,
    recoverySuccesses:Number(req.body?.recoverySuccesses)||3
  });
  try{
    await pool.query(`INSERT INTO canary_hysteresis_events
      (rollout_key,health_score,consecutive_failures,action)
      VALUES($1,$2,$3,$4)`,[
      req.body?.rolloutKey||"unknown",
      Number(req.body?.healthScore)||0,
      Number(req.body?.consecutiveFailures)||0,
      r.action
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/delegation/renew",async(req,res)=>{
  const r=renewFencedLease({
    status:req.body?.status,
    runKey:req.body?.runKey,
    workerId:req.body?.workerId,
    leaseToken:req.body?.leaseToken,
    presentedFencingVersion:Number(req.body?.presentedFencingVersion),
    currentFencingVersion:Number(req.body?.currentFencingVersion),
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    extensionSeconds:Number(req.body?.extensionSeconds)||300
  });
  try{
    await pool.query(`INSERT INTO lease_fence_renewals
      (run_key,worker_id,lease_token,fencing_version,result)
      VALUES($1,$2,$3,$4,$5)`,[
      req.body?.runKey||"unknown",
      req.body?.workerId||"unknown",
      req.body?.leaseToken||"unknown",
      Number(req.body?.currentFencingVersion)||0,
      r.status
    ]);
  }catch{}
  res.json(r);
});

app.post("/api/security/risk/online-calibration",async(req,res)=>{
  const r=updateOnlineCalibration({
    residualWindow:req.body?.residualWindow||[],
    coverageTarget:Number(req.body?.coverageTarget)||.9,
    actuals:req.body?.actuals||[],
    predictions:req.body?.predictions||[]
  });
  if(r.status==="UPDATED"){
    try{
      await pool.query(`INSERT INTO online_calibration_windows
        (window_size,coverage_target,interval_radius,empirical_coverage)
        VALUES($1,$2,$3,$4)`,[
        r.windowSize,r.coverageTarget,
        r.intervalRadius,r.empiricalCoverage
      ]);
    }catch{}
  }
  res.json(r);
});

app.post("/api/security/risk/drift-alert",async(req,res)=>{
  const r=buildDriftAlert({
    driftRatio:Number(req.body?.driftRatio),
    warningRatio:Number(req.body?.warningRatio)||1.25,
    criticalRatio:Number(req.body?.criticalRatio)||1.75
  });
  if(r.status==="ALERT"){
    try{
      await pool.query(`INSERT INTO forecast_drift_alerts
        (drift_ratio,severity,message)
        VALUES($1,$2,$3)`,[
        Number(req.body?.driftRatio),
        r.severity,
        r.message
      ]);
    }catch{}
  }
  res.json(r);
});

app.get("/api/security/phase123-dashboard",async(_req,res)=>{
  try{
    const [cas,hysteresis,renewals,calibration,alerts]=await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM fencing_cas_operations
        WHERE result='ABORTED' AND created_at>NOW()-INTERVAL '30 days'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM canary_hysteresis_events
        WHERE action='ROLLBACK' AND created_at>NOW()-INTERVAL '30 days'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM lease_fence_renewals
        WHERE result='RENEWED' AND created_at>NOW()-INTERVAL '24 hours'`),
      pool.query(`SELECT empirical_coverage,interval_radius
        FROM online_calibration_windows ORDER BY created_at DESC LIMIT 1`),
      pool.query(`SELECT COUNT(*)::int AS count FROM forecast_drift_alerts
        WHERE acknowledged=false`)
    ]);
    res.json({
      abortedCasFencing30d:cas.rows[0].count,
      canaryRollbacks30d:hysteresis.rows[0].count,
      fencedLeaseRenewals24h:renewals.rows[0].count,
      latestOnlineCalibration:calibration.rows[0]||null,
      activeDriftAlerts:alerts.rows[0].count
    });
  }catch{
    res.status(500).json({error:"Could not load Phase 123 dashboard"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 123 API running"));


module.exports = app;
