const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildExecutionPlan}=require("./retention-executor");
const {rollingBaseline}=require("./rolling-baseline");
const {commitCheckpoint}=require("./calibration-checkpoint-cas");
const {verifyPersistedIntegrity}=require("./manifest-integrity");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:134}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/authorize",
async(req,res)=>{
 const r=buildExecutionPlan({
  role:req.body.role,
  action:req.body.action||"DRY_RUN",
  table:req.body.table,
  retentionDays:req.body.retentionDays,
  batchSize:req.body.batchSize
 });

 try{
  await pool.query(
   `INSERT INTO retention_execution_audit
    (policy_key,handler_key,requested_by,result)
    VALUES($1,$2,$3,$4)`,
   [
    req.body.policyKey||"default",
    req.body.table||"unknown",
    req.body.role||"unknown",
    r.status==="AUTHORIZED"
      ?(r.action==="DRY_RUN"?"DRY_RUN":"COMPLETED")
      :"DENIED"
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/delegation/retry-baseline",
async(req,res)=>{
 const r=rollingBaseline({
  previous:req.body.previous||[],
  incoming:req.body.incoming||[],
  maxSamples:req.body.maxSamples
 });

 try{
  await pool.query(
   `INSERT INTO retry_rolling_baselines
    (run_key,sample_count,p50_ms,p95_ms,p99_ms)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(run_key)
    DO UPDATE SET sample_count=EXCLUDED.sample_count,
      p50_ms=EXCLUDED.p50_ms,
      p95_ms=EXCLUDED.p95_ms,
      p99_ms=EXCLUDED.p99_ms,
      updated_at=NOW()`,
   [
    req.body.runKey||"default",
    r.sampleCount,r.p50Ms,r.p95Ms,r.p99Ms
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/checkpoint",
async(req,res)=>{
 const r=commitCheckpoint({
  currentVersion:Number(req.body.currentVersion)||0,
  expectedVersion:Number(req.body.expectedVersion)||0,
  action:req.body.action||"HOLD",
  windowSize:Number(req.body.windowSize)||100,
  stableCycles:Number(req.body.stableCycles)||0
 });

 if(r.status==="COMMITTED"){
  try{
   await pool.query(
    `INSERT INTO calibration_checkpoint_cas
     (model_key,checkpoint_version,action,window_size,stable_cycles)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(model_key)
     DO UPDATE SET checkpoint_version=EXCLUDED.checkpoint_version,
       action=EXCLUDED.action,
       window_size=EXCLUDED.window_size,
       stable_cycles=EXCLUDED.stable_cycles,
       updated_at=NOW()`,
    [
     req.body.modelKey||"default",
     r.version,r.action,r.windowSize,r.stableCycles
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/governance/manifest/integrity",
async(req,res)=>{
 const r=verifyPersistedIntegrity({
  expectedPayloadHash:req.body.expectedPayloadHash,
  expectedManifestHash:req.body.expectedManifestHash,
  actualPayloadHash:req.body.actualPayloadHash,
  actualManifestHash:req.body.actualManifestHash
 });

 try{
  await pool.query(
   `INSERT INTO manifest_integrity_state
    (export_id,payload_hash,manifest_hash,verification_status,verified_at)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(export_id)
    DO UPDATE SET payload_hash=EXCLUDED.payload_hash,
      manifest_hash=EXCLUDED.manifest_hash,
      verification_status=EXCLUDED.verification_status,
      verified_at=EXCLUDED.verified_at,
      updated_at=NOW()`,
   [
    req.body.exportId,
    req.body.actualPayloadHash,
    req.body.actualManifestHash,
    r.status,
    r.verifiedAt
   ]
  );
 }catch{}

 res.json(r);
});

app.get("/api/security/phase134-dashboard",async(_q,res)=>{
 try{
  const [retention,baselines,checkpoints,integrity]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
      FROM retention_execution_audit
      WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
      FROM retry_rolling_baselines`),
    pool.query(`SELECT COUNT(*)::int count
      FROM calibration_checkpoint_cas`),
    pool.query(`SELECT COUNT(*)::int count
      FROM manifest_integrity_state
      WHERE verification_status='VERIFIED'
      AND updated_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   retentionAuthorizations30d:retention.rows[0].count,
   rollingRetryBaselines:baselines.rows[0].count,
   calibrationCheckpoints:checkpoints.rows[0].count,
   verifiedIntegrityRecords30d:integrity.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 134 API running"
));


module.exports = app;
