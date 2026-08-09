const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {executeRepair}=require("./repair-executor");
const {calculateBurnRate}=require("./burn-rate");
const {classifyConflict}=require("./lease-conflict");
const {transition}=require("./quarantine-state");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:145}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/reconciliation/execute",
async(req,res)=>{
 const r=executeRepair({
  attempt:req.body.attempt,
  maxAttempts:req.body.maxAttempts||3,
  repairable:req.body.repairable!==false,
  detail:req.body.detail||""
 });

 try{
  await pool.query(
   `INSERT INTO repair_execution_history
    (queue_id,worker_id,attempt,outcome,detail)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.queueId,
    req.body.workerId||"system",
    r.attempt,
    r.outcome,
    r.detail
   ]
  );

  if(r.outcome==="REPAIRED"){
   await pool.query(
    `UPDATE reconciliation_repair_queue
     SET status='REPAIRED',repaired_at=NOW()
     WHERE id=$1`,
    [req.body.queueId]
   );
  }else if(r.outcome==="FAILED"){
   await pool.query(
    `UPDATE reconciliation_repair_queue
     SET status='REJECTED'
     WHERE id=$1`,
    [req.body.queueId]
   );
  }

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/delegation/recovery-slo/burn-rate",
async(req,res)=>{
 const r=calculateBurnRate({
  complianceRatio:req.body.complianceRatio,
  targetRatio:req.body.targetRatio||.99,
  threshold:req.body.threshold||2
 });

 try{
  await pool.query(
   `INSERT INTO slo_burn_rate_alerts
    (alert_class,window_minutes,compliance_ratio,
     burn_rate,threshold,state)
    VALUES($1,$2,$3,$4,$5,$6)`,
   [
    req.body.alertClass||"UNKNOWN",
    Number(req.body.windowMinutes)||60,
    r.complianceRatio,
    r.burnRate,
    r.threshold,
    r.state
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/lease-conflict",
async(req,res)=>{
 const r=classifyConflict({
  modelKey:req.body.modelKey,
  ownerId:req.body.ownerId,
  fencingVersion:req.body.fencingVersion,
  conflictType:req.body.conflictType
 });

 if(r.status==="RECORDED"){
  try{
   await pool.query(
    `INSERT INTO lease_conflict_analytics
     (model_key,owner_id,fencing_version,conflict_type)
     VALUES($1,$2,$3,$4)`,
    [
     r.modelKey,r.ownerId,r.fencingVersion,
     r.conflictType
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/governance/quarantine/transition",
async(req,res)=>{
 const r=transition({
  currentState:req.body.currentState,
  nextState:req.body.nextState,
  actorId:req.body.actorId,
  evidence:req.body.evidence||{}
 });

 if(r.status!=="TRANSITIONED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO quarantine_state_history
    (quarantine_id,from_state,to_state,
     actor_id,evidence_json)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.quarantineId,
    r.fromState,
    r.toState,
    r.actorId,
    JSON.stringify(r.evidence)
   ]
  );

  await pool.query(
   `UPDATE replay_conflict_quarantine
    SET resolved_at=CASE
      WHEN $2 IN ('RELEASED','REJECTED','RESOLVED')
      THEN NOW() ELSE resolved_at END
    WHERE id=$1`,
   [req.body.quarantineId,r.toState]
  );

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase145-dashboard",
async(_q,res)=>{
 try{
  const [repairs,burn,conflicts,quarantine]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM repair_execution_history
     WHERE outcome='FAILED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM slo_burn_rate_alerts
     WHERE state='BREACH'
     AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM lease_conflict_analytics
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM quarantine_state_history
     WHERE to_state='REPROCESSING'
     AND created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   failedRepairs30d:repairs.rows[0].count,
   burnRateBreaches24h:burn.rows[0].count,
   leaseConflicts30d:conflicts.rows[0].count,
   reprocessingTransitions30d:quarantine.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 145 API running"
));


module.exports = app;
