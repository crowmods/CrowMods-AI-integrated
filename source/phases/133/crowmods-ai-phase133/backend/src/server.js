const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildPurgePlan}=require("./retention-executor");
const {detectRetryAnomaly}=require("./retry-anomaly");
const {recoverCalibration}=require("./calibration-recovery");
const {verifyManifest}=require("./manifest-verifier");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:133}));
app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/plan",async(req,res)=>{
 const plan=buildPurgePlan({
  records:req.body.records||[],
  now:req.body.now||new Date(),
  retentionDays:Number(req.body.retentionDays)||30,
  batchSize:Number(req.body.batchSize)||100,
  dryRun:req.body.dryRun===true
 });
 try{
  const run=await pool.query(
   `INSERT INTO retention_purge_runs
    (policy_key,batch_size,examined_count,purged_count,
     skipped_count,result)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
   [
    req.body.policyKey||"default",
    plan.batchSize,
    plan.examinedCount,
    req.body.dryRun?0:plan.eligibleCount,
    plan.examinedCount-plan.eligibleCount,
    req.body.dryRun?"DRY_RUN":
      plan.eligibleCount===plan.examinedCount
       ?"COMPLETED":"PARTIAL"
   ]
  );
  res.json({...plan,runId:run.rows[0].id});
 }catch{
  res.status(500).json({error:"retention_audit_failed"});
 }
});

app.post("/api/security/delegation/retry-anomaly",async(req,res)=>{
 const r=detectRetryAnomaly({
  currentP95:req.body.currentP95,
  baselineP95:req.body.baselineP95,
  warningRatio:Number(req.body.warningRatio)||1.25,
  criticalRatio:Number(req.body.criticalRatio)||1.75
 });
 try{
  await pool.query(
   `INSERT INTO retry_trend_anomalies
    (run_key,current_p95_ms,baseline_p95_ms,
     deviation_ratio,severity)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.runKey||"unknown",
    Number(req.body.currentP95),
    Number(req.body.baselineP95),
    r.deviationRatio,
    r.severity
   ]
  );
 }catch{}
 res.json(r);
});

app.post("/api/security/risk/calibration/recover",async(req,res)=>{
 const r=recoverCalibration({
  persistedAction:req.body.persistedAction||"HOLD",
  persistedWindow:Number(req.body.persistedWindow)||100,
  persistedStableCycles:Number(req.body.persistedStableCycles)||0,
  checkpointVersion:Number(req.body.checkpointVersion)||0,
  requestedVersion:Number(req.body.requestedVersion)||0,
  minWindow:Number(req.body.minWindow)||50,
  maxWindow:Number(req.body.maxWindow)||1000
 });
 if(r.status==="RECOVERED"){
  try{
   await pool.query(
    `INSERT INTO calibration_recovery_state
     (model_key,action,window_size,stable_cycles,
      checkpoint_version)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(model_key)
     DO UPDATE SET action=EXCLUDED.action,
       window_size=EXCLUDED.window_size,
       stable_cycles=EXCLUDED.stable_cycles,
       checkpoint_version=EXCLUDED.checkpoint_version,
       updated_at=NOW()`,
    [
     req.body.modelKey||"default",
     r.action,r.windowSize,r.stableCycles,
     r.checkpointVersion
    ]
   );
  }catch{}
 }
 res.json(r);
});

app.post("/api/security/governance/alert/verify-manifest",async(req,res)=>{
 const r=verifyManifest({
  reviewer:req.body.reviewer,
  events:req.body.events||[],
  expectedPayloadHash:req.body.expectedPayloadHash,
  expectedManifestHash:req.body.expectedManifestHash
 });
 try{
  await pool.query(
   `INSERT INTO manifest_verification_events
    (export_id,expected_payload_hash,actual_payload_hash,
     expected_manifest_hash,actual_manifest_hash,result)
    VALUES($1,$2,$3,$4,$5,$6)`,
   [
    req.body.exportId||null,
    req.body.expectedPayloadHash||"",
    r.actualPayloadHash,
    req.body.expectedManifestHash||"",
    r.actualManifestHash,
    r.result
   ]
  );
 }catch{}
 res.json(r);
});

app.get("/api/security/phase133-dashboard",async(_q,res)=>{
 try{
  const [purges,anomalies,recovery,verification]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
      FROM retention_purge_runs
      WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
      FROM retry_trend_anomalies
      WHERE severity IN ('WARNING','CRITICAL')
      AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
      FROM calibration_recovery_state`),
    pool.query(`SELECT COUNT(*)::int count
      FROM manifest_verification_events
      WHERE result='VERIFIED'
      AND created_at>NOW()-INTERVAL '30 days'`)
   ]);
  res.json({
   purgeRuns30d:purges.rows[0].count,
   retryAnomalies24h:anomalies.rows[0].count,
   calibrationRecoveryStates:recovery.rows[0].count,
   verifiedManifests30d:verification.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 133 API running"
));
