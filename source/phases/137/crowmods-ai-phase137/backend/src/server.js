const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildEligibleRows}=require("./purge-sql-enforcer");
const {evaluateAlert}=require("./alert-escalation");
const {writeCheckpoint}=require("./fenced-checkpoint");
const {buildWorkerBatch}=require("./manifest-worker");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:137}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/sql-eligible",
(req,res)=>{
 res.json(buildEligibleRows({
  rows:req.body.rows||[],
  retentionDays:Number(req.body.retentionDays)||30,
  now:req.body.now||new Date()
 }));
});

app.post("/api/security/delegation/baseline-alert/evaluate",
async(req,res)=>{
 const r=evaluateAlert({
  severity:req.body.severity,
  consecutiveHits:Number(req.body.consecutiveHits)||0,
  cooldownUntil:req.body.cooldownUntil,
  now:req.body.now||new Date(),
  warningThreshold:Number(req.body.warningThreshold)||2,
  criticalThreshold:Number(req.body.criticalThreshold)||4,
  cooldownMs:Number(req.body.cooldownMs)||300000
 });

 try{
  await pool.query(
   `INSERT INTO alert_cooldown_state
    (alert_key,severity,consecutive_hits,
     cooldown_until,escalated)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(alert_key)
    DO UPDATE SET severity=EXCLUDED.severity,
      consecutive_hits=EXCLUDED.consecutive_hits,
      cooldown_until=EXCLUDED.cooldown_until,
      escalated=EXCLUDED.escalated,
      updated_at=NOW()`,
   [
    req.body.alertKey||"unknown",
    r.severity,
    Number(req.body.consecutiveHits)||0,
    r.cooldownUntil||null,
    r.action==="ESCALATE"
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/checkpoint/fenced",
async(req,res)=>{
 try{
  res.json(await writeCheckpoint(pool,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   fencingVersion:Number(req.body.fencingVersion),
   expectedCheckpoint:Number(req.body.expectedCheckpoint),
   action:req.body.action||"HOLD",
   windowSize:Number(req.body.windowSize)||100
  }));
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/worker-batch",
async(req,res)=>{
 const batch=buildWorkerBatch({
  exports:req.body.exports||[],
  batchSize:req.body.batchSize
 });

 try{
  const q=await pool.query(
   `INSERT INTO manifest_verification_worker_runs
    (worker_id,batch_size,examined_count,
     verified_count,mismatch_count,result)
    VALUES($1,$2,$3,$4,$5,'COMPLETED')
    RETURNING id`,
   [
    req.body.workerId||"system",
    batch.batchSize,
    batch.examinedCount,
    0,0
   ]
  );
  res.json({...batch,runId:q.rows[0].id});
 }catch{
  res.status(500).json({error:"worker_audit_failed"});
 }
});

app.get("/api/security/phase137-dashboard",
async(_q,res)=>{
 try{
  const [alerts,checkpoints,workers]=await Promise.all([
   pool.query(`SELECT COUNT(*)::int count
    FROM alert_cooldown_state
    WHERE escalated=true`),
   pool.query(`SELECT COUNT(*)::int count
    FROM calibration_checkpoint_writes
    WHERE result='COMMITTED'
    AND created_at>NOW()-INTERVAL '30 days'`),
   pool.query(`SELECT COUNT(*)::int count
    FROM manifest_verification_worker_runs
    WHERE created_at>NOW()-INTERVAL '30 days'`)
  ]);

  res.json({
   escalatedAlerts:alerts.rows[0].count,
   committedCheckpointWrites:checkpoints.rows[0].count,
   manifestWorkerRuns30d:workers.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 137 API running"
));
