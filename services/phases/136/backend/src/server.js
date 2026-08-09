const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {isEligible}=require("./purge-eligibility");
const {shouldTrigger}=require("./alert-cooldown");
const lease=require("./calibration-lease-cas");
const {buildBatch}=require("./reverification-batch");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:136}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/check",
(req,res)=>{
 res.json(isEligible({
  createdAt:req.body.createdAt,
  retentionDays:req.body.retentionDays,
  now:req.body.now||new Date()
 }));
});

app.post("/api/security/delegation/baseline-alert/cooldown",
async(req,res)=>{
 const r=shouldTrigger({
  alertKey:req.body.alertKey,
  severity:req.body.severity,
  now:req.body.now||new Date(),
  cooldownUntil:req.body.cooldownUntil,
  cooldownMs:Number(req.body.cooldownMs)||300000
 });

 if(r.trigger){
  try{
   await pool.query(
    `INSERT INTO baseline_alert_cooldowns
     (alert_key,last_severity,last_triggered_at,
      cooldown_until)
     VALUES($1,$2,NOW(),$3)
     ON CONFLICT(alert_key)
     DO UPDATE SET last_severity=EXCLUDED.last_severity,
       last_triggered_at=EXCLUDED.last_triggered_at,
       cooldown_until=EXCLUDED.cooldown_until,
       trigger_count=
        baseline_alert_cooldowns.trigger_count+1,
       updated_at=NOW()`,
    [r.alertKey,r.severity,r.cooldownUntil]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/risk/calibration/lease/acquire",
async(req,res)=>{
 try{
  res.json(await lease.acquire(pool,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   leaseToken:req.body.leaseToken,
   expectedVersion:Number(req.body.expectedVersion)||0,
   leaseExpiresAt:req.body.leaseExpiresAt
  }));
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/risk/calibration/lease/renew",
async(req,res)=>{
 try{
  res.json(await lease.renew(pool,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   leaseToken:req.body.leaseToken,
   expectedVersion:Number(req.body.expectedVersion)||0,
   leaseExpiresAt:req.body.leaseExpiresAt
  }));
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/reverify-batch",
async(req,res)=>{
 const batch=buildBatch({
  exports:req.body.exports||[],
  batchSize:req.body.batchSize
 });

 try{
  const q=await pool.query(
   `INSERT INTO manifest_reverification_batches
    (requested_by,batch_size,examined_count,
     verified_count,mismatch_count,result)
    VALUES($1,$2,$3,$4,$5,'COMPLETED')
    RETURNING id`,
   [
    req.body.requestedBy||"system",
    batch.batchSize,
    batch.examinedCount,
    0,0
   ]
  );
  res.json({...batch,batchId:q.rows[0].id});
 }catch{
  res.status(500).json({error:"batch_audit_failed"});
 }
});

app.get("/api/security/phase136-dashboard",
async(_q,res)=>{
 try{
  const [purge,cooldown,leases,batches]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
      FROM purge_eligibility_rules
      WHERE enabled=true`),
    pool.query(`SELECT COUNT(*)::int count
      FROM baseline_alert_cooldowns
      WHERE cooldown_until>NOW()`),
    pool.query(`SELECT COUNT(*)::int count
      FROM calibration_checkpoint_leases
      WHERE lease_expires_at>NOW()`),
    pool.query(`SELECT COUNT(*)::int count
      FROM manifest_reverification_batches
      WHERE created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   enabledPurgeRules:purge.rows[0].count,
   activeAlertCooldowns:cooldown.rows[0].count,
   activeCalibrationLeases:leases.rows[0].count,
   reverifyBatches30d:batches.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 136 API running"
));


module.exports = app;
