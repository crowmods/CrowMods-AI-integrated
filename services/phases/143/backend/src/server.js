const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {reconcile}=require("./purge-reconcile");
const {evaluateSLO}=require("./recovery-slo");
const calibration=require("./lease-renew-commit");
const {classifyConflict}=require("./replay-quarantine");
const {buildCleanupBatch}=require("./replay-bounded-cleanup");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:143}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/reconcile",
async(req,res)=>{
 const r=reconcile({
  auditOutcome:req.body.auditOutcome,
  executionOutcome:req.body.executionOutcome
 });

 try{
  await pool.query(
   `INSERT INTO purge_reconciliation_results
    (run_id,record_key,audit_outcome,
     execution_outcome,reconciliation)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.runId,
    String(req.body.recordKey),
    req.body.auditOutcome||"",
    req.body.executionOutcome||"",
    r.result
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/delegation/baseline-alert/slo",
async(req,res)=>{
 const r=evaluateSLO({
  incidentStartedAt:req.body.incidentStartedAt,
  recoveredAt:req.body.recoveredAt,
  targetSeconds:req.body.targetSeconds||900,
  now:req.body.now||new Date()
 });

 try{
  await pool.query(
   `INSERT INTO alert_recovery_slo_samples
    (alert_key,incident_started_at,recovered_at,
     recovery_seconds,target_seconds,result)
    VALUES($1,$2,$3,$4,$5,$6)`,
   [
    req.body.alertKey||"unknown",
    req.body.incidentStartedAt,
    req.body.recoveredAt||null,
    r.recoverySeconds,
    Number(req.body.targetSeconds)||900,
    r.result
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/renew-commit",
async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");

  const r=await calibration.commit(client,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   leaseToken:req.body.leaseToken,
   fencingVersion:Number(req.body.fencingVersion),
   expectedCheckpoint:Number(
    req.body.expectedCheckpoint
   ),
   newLeaseExpiry:req.body.newLeaseExpiry,
   action:req.body.action||"HOLD",
   windowSize:Number(req.body.windowSize)||100
  });

  await client.query(
   `INSERT INTO calibration_atomic_commits
    (model_key,owner_id,fencing_version,
     old_checkpoint_version,new_checkpoint_version,
     action,result)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [
    req.body.modelKey,
    req.body.ownerId,
    Number(req.body.fencingVersion),
    Number(req.body.expectedCheckpoint),
    r.newCheckpointVersion||
      Number(req.body.expectedCheckpoint),
    req.body.action||"HOLD",
    r.status
   ]
  );

  await client.query("COMMIT");
  res.json(r);
 }catch{
  await client.query("ROLLBACK");
  res.status(500).json({status:"FAILED"});
 }finally{
  client.release();
 }
});

app.post("/api/security/governance/manifest/quarantine",
async(req,res)=>{
 const key=req.body.idempotencyKey;
 if(!key)
  return res.status(400).json({
   action:"DENIED",reason:"missing_idempotency_key"
  });

 try{
  const q=await pool.query(
   `SELECT export_id,payload_hash,manifest_hash
    FROM manifest_verification_idempotency
    WHERE idempotency_key=$1`,
   [key]
  );

  if(!q.rowCount)
    return res.json({action:"NEW"});

  const r=classifyConflict({
   existingExportId:String(q.rows[0].export_id),
   requestedExportId:String(req.body.exportId),
   idempotencyKey:key,
   payloadHash:req.body.payloadHash||q.rows[0].payload_hash,
   manifestHash:req.body.manifestHash||q.rows[0].manifest_hash
  });

  if(r.action==="QUARANTINE"){
   await pool.query(
    `INSERT INTO replay_conflict_quarantine
     (idempotency_key,export_id,reason,
      payload_hash,manifest_hash)
     VALUES($1,$2,$3,$4,$5)`,
    [
     key,req.body.exportId,r.reason,
     r.payloadHash,r.manifestHash
    ]
   );
  }

  res.json(r);
 }catch{
  res.status(500).json({action:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/bounded-cleanup",
async(req,res)=>{
 const result=buildCleanupBatch({
  entries:req.body.entries||[],
  batchSize:req.body.batchSize,
  now:req.body.now||new Date()
 });

 try{
  if(result.keys.length){
   await pool.query(
    `DELETE FROM manifest_replay_cache
     WHERE idempotency_key = ANY($1::text[])`,
    [result.keys]
   );
  }

  await pool.query(
   `INSERT INTO replay_cache_cleanup_metrics
    (worker_id,examined_count,removed_count,conflict_count)
    VALUES($1,$2,$3,$4)`,
   [
    req.body.workerId||"system",
    result.examinedCount,
    result.expiredCount,
    0
   ]
  );

  res.json(result);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase143-dashboard",
async(_q,res)=>{
 try{
  const [recon,slo,quarantine,cleanup]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM purge_reconciliation_results
     WHERE reconciliation='MISMATCH'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM alert_recovery_slo_samples
     WHERE result='MISSED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM replay_conflict_quarantine
     WHERE resolved_at IS NULL`),
    pool.query(`SELECT COALESCE(SUM(removed_count),0)::int count
     FROM replay_cache_cleanup_metrics
     WHERE created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   purgeMismatches30d:recon.rows[0].count,
   missedRecoverySLOs30d:slo.rows[0].count,
   unresolvedReplayConflicts:quarantine.rows[0].count,
   replayCacheEntriesRemoved30d:cleanup.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 143 API running"
));


module.exports = app;
