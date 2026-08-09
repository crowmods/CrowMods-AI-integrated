const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildOutcome}=require("./purge-outcome");
const {evaluateRecovery}=require("./alert-transition");
const calibration=require("./fenced-calibration");
const {classifyCleanup}=require("./replay-cleanup");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:142}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/outcome",
async(req,res)=>{
 const r=buildOutcome({
  runId:req.body.runId,
  recordKey:req.body.recordKey,
  tableName:req.body.tableName,
  outcome:req.body.outcome||"FAILED",
  auditId:req.body.auditId||null
 });

 if(r.status!=="READY")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO purge_outcome_transactions
    (run_id,record_key,table_name,outcome,audit_id)
    VALUES($1,$2,$3,$4,$5)`,
   [
    r.runId,r.recordKey,r.tableName,
    r.outcome,r.auditId
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/delegation/baseline-alert/recovery",
async(req,res)=>{
 const r=evaluateRecovery({
  state:req.body.state,
  healthyCycles:req.body.healthyCycles,
  cooldownUntil:req.body.cooldownUntil,
  now:req.body.now||new Date(),
  recoveryCycles:req.body.recoveryCycles||3,
  cooldownMs:req.body.cooldownMs||300000
 });

 try{
  await pool.query(
   `INSERT INTO alert_transition_history
    (alert_key,from_state,to_state,reason,cooldown_until)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.alertKey||"unknown",
    req.body.state||"NORMAL",
    r.state,
    r.reason,
    r.cooldownUntil||null
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/fenced-commit",
async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");

  const r=await calibration.commit(client,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   fencingVersion:Number(req.body.fencingVersion),
   expectedCheckpoint:Number(
    req.body.expectedCheckpoint
   ),
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

app.post("/api/security/governance/manifest/cache-cleanup",
async(req,res)=>{
 const entries=req.body.entries||[];
 const result=classifyCleanup({
  entries,
  now:req.body.now||new Date()
 });

 try{
  const q=await pool.query(
   `DELETE FROM manifest_replay_cache
    WHERE expires_at<=COALESCE($1::timestamptz,NOW())`,
   [req.body.now||null]
  );

  const removed=Math.max(
   result.removedCount,
   Number(q.rowCount)||0
  );

  await pool.query(
   `INSERT INTO replay_cache_cleanup_metrics
    (worker_id,examined_count,removed_count,conflict_count)
    VALUES($1,$2,$3,$4)`,
   [
    req.body.workerId||"system",
    result.examinedCount,
    removed,
    result.conflictCount
   ]
  );

  res.json({
   ...result,
   removedCount:removed
  });
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase142-dashboard",
async(_q,res)=>{
 try{
  const [outcomes,transitions,commits,cleanup]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM purge_outcome_transactions
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM alert_transition_history
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM calibration_atomic_commits
     WHERE result='COMMITTED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COALESCE(SUM(removed_count),0)::int count
     FROM replay_cache_cleanup_metrics
     WHERE created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   purgeOutcomes30d:outcomes.rows[0].count,
   alertTransitions30d:transitions.rows[0].count,
   fencedCalibrationCommits30d:commits.rows[0].count,
   replayCacheEntriesRemoved30d:cleanup.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 142 API running"
));
