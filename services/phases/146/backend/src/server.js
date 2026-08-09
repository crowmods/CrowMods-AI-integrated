const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {scheduleBackoff}=require("./repair-backoff");
const {evaluateWindows,overallState}=require("./multiwindow-burn");
const {calculateRate}=require("./lease-conflict-rate");
const {close}=require("./quarantine-closure");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:146}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/reconciliation/backoff",
async(req,res)=>{
 const r=scheduleBackoff({
  attempt:req.body.attempt,
  maxAttempts:req.body.maxAttempts||3,
  baseDelayMs:req.body.baseDelayMs||1000,
  maxDelayMs:req.body.maxDelayMs||300000,
  now:req.body.now||new Date()
 });

 try{
  await pool.query(
   `INSERT INTO repair_backoff_schedule
    (queue_id,next_attempt_at,attempt,max_attempts,state)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(queue_id)
    DO UPDATE SET next_attempt_at=EXCLUDED.next_attempt_at,
      attempt=EXCLUDED.attempt,
      max_attempts=EXCLUDED.max_attempts,
      state=EXCLUDED.state,
      updated_at=NOW()`,
   [
    req.body.queueId,
    r.nextAttemptAt||new Date(),
    r.attempt||req.body.attempt,
    r.maxAttempts||req.body.maxAttempts||3,
    r.state
   ]
  );

  if(r.state==="DEAD_LETTER"){
   await pool.query(
    `INSERT INTO repair_dead_letter_queue
     (queue_id,final_attempt,reason)
     VALUES($1,$2,$3)`,
    [
     req.body.queueId,
     Number(req.body.attempt),
     "maximum_attempts_exceeded"
    ]
   );
  }

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/delegation/recovery-slo/multi-window",
async(req,res)=>{
 const results=evaluateWindows(
  req.body.windows||[],
  {
   targetRatio:req.body.targetRatio||.99,
   threshold:req.body.threshold||2
  }
 );
 const state=overallState(results);

 try{
  for(const r of results){
   await pool.query(
    `INSERT INTO slo_multiwindow_burn_rates
     (alert_class,window_minutes,compliance_ratio,
      burn_rate,state)
     VALUES($1,$2,$3,$4,$5)`,
    [
     req.body.alertClass||"UNKNOWN",
     r.windowMinutes,
     r.complianceRatio,
     r.burnRate,
     r.state
    ]
   );
  }
 }catch{}

 res.json({state,windows:results});
});

app.post("/api/security/risk/calibration/conflict-rate",
async(req,res)=>{
 const r=calculateRate({
  conflictCount:req.body.conflictCount,
  requestCount:req.body.requestCount,
  threshold:req.body.threshold||.05
 });

 try{
  await pool.query(
   `INSERT INTO lease_conflict_rate_samples
    (model_key,window_minutes,conflict_count,
     request_count,conflict_rate)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.modelKey||"unknown",
    Number(req.body.windowMinutes)||60,
    r.conflictCount,
    r.requestCount,
    r.conflictRate
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/governance/quarantine/immutable-close",
async(req,res)=>{
 const r=close({
  quarantineId:req.body.quarantineId,
  closureState:req.body.closureState,
  actorId:req.body.actorId,
  evidence:req.body.evidence||{}
 });

 if(r.status!=="CLOSED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO quarantine_immutable_closures
    (quarantine_id,closure_state,actor_id,evidence_hash)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(quarantine_id) DO NOTHING`,
   [
    r.quarantineId,r.closureState,
    r.actorId,r.evidenceHash
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase146-dashboard",
async(_q,res)=>{
 try{
  const [dead,burn,conflicts,closed]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM repair_dead_letter_queue
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM slo_multiwindow_burn_rates
     WHERE state='BREACH'
     AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM lease_conflict_rate_samples
     WHERE state='BREACH'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM quarantine_immutable_closures
     WHERE closed_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   deadLetterRepairs30d:dead.rows[0].count,
   multiWindowBurnBreaches24h:burn.rows[0].count,
   leaseConflictRateBreaches30d:conflicts.rows[0].count,
   immutableClosures30d:closed.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 146 API running"
));


module.exports = app;
