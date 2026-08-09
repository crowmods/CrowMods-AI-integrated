const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {authorizeRedrive}=require("./redrive");
const {classifyBurnRate}=require("./burn-severity");
const {detectTrend}=require("./lease-trend");
const {appendEvidence,verifyChain}=require("./evidence-chain");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:147}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/reconciliation/redrive",
async(req,res)=>{
 const r=authorizeRedrive({
  status:req.body.status,
  actorId:req.body.actorId,
  currentAttempt:req.body.currentAttempt,
  maxAttempts:req.body.maxAttempts||3,
  reason:req.body.reason
 });

 if(r.status!=="AUTHORIZED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO repair_redrive_history
    (queue_id,actor_id,action,target_attempt,reason)
    VALUES($1,$2,'REDRIVE',$3,$4)`,
   [
    req.body.queueId,r.actorId,
    r.targetAttempt,r.reason
   ]
  );

  await pool.query(
   `UPDATE repair_backoff_schedule
    SET state='READY',attempt=$1,next_attempt_at=NOW(),
      updated_at=NOW()
    WHERE queue_id=$2`,
   [r.targetAttempt,req.body.queueId]
  );

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/delegation/recovery-slo/severity",
async(req,res)=>{
 const r=classifyBurnRate(req.body.burnRate);

 try{
  await pool.query(
   `INSERT INTO slo_burn_rate_severity
    (alert_class,window_minutes,burn_rate,severity)
    VALUES($1,$2,$3,$4)`,
   [
    req.body.alertClass||"UNKNOWN",
    Number(req.body.windowMinutes)||60,
    r.burnRate,
    r.severity
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/conflict-trend",
async(req,res)=>{
 const r=detectTrend({
  observedRate:req.body.observedRate,
  baselineRate:req.body.baselineRate,
  spikeMultiplier:req.body.spikeMultiplier||3,
  elevatedMultiplier:req.body.elevatedMultiplier||1.5
 });

 try{
  await pool.query(
   `INSERT INTO lease_conflict_trend_samples
    (model_key,observed_rate,baseline_rate,
     delta_ratio,state)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.modelKey||"unknown",
    Number(req.body.observedRate)||0,
    Number(req.body.baselineRate)||0,
    r.deltaRatio===Infinity?999999:r.deltaRatio,
    r.state
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/governance/quarantine/evidence",
async(req,res)=>{
 const r=appendEvidence({
  quarantineId:req.body.quarantineId,
  previousHash:req.body.previousHash||null,
  evidence:req.body.evidence||{},
  actorId:req.body.actorId
 });

 if(r.status!=="APPENDED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO quarantine_evidence_chain
    (quarantine_id,previous_hash,evidence_hash,
     chain_hash,actor_id)
    VALUES($1,$2,$3,$4,$5)`,
   [
    r.quarantineId,r.previousHash,
    r.evidenceHash,r.chainHash,r.actorId
   ]
  );

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/quarantine/evidence/verify",
async(req,res)=>{
 try{
  const q=await pool.query(
   `SELECT id,evidence_hash,chain_hash,actor_id
    FROM quarantine_evidence_chain
    WHERE quarantine_id=$1
    ORDER BY created_at ASC`,
   [req.body.quarantineId]
  );

  res.json(verifyChain(q.rows));
 }catch{
  res.status(500).json({valid:false});
 }
});

app.get("/api/security/phase147-dashboard",
async(_q,res)=>{
 try{
  const [redrive,burn,trends,chains]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM repair_redrive_history
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM slo_burn_rate_severity
     WHERE severity='CRITICAL'
     AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM lease_conflict_trend_samples
     WHERE state='SPIKE'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM quarantine_evidence_chain
     WHERE created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   redrives30d:redrive.rows[0].count,
   criticalBurnRates24h:burn.rows[0].count,
   leaseConflictSpikes30d:trends.rows[0].count,
   evidenceChainEntries30d:chains.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 147 API running"
));


module.exports = app;
