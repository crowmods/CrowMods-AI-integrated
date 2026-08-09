const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildLockPolicy}=require("./purge-locks");
const {evaluatePolicy}=require("./alert-recovery-policy");
const {validateBinding}=require("./lease-checkpoint-binding");
const {checkIdempotency}=require("./manifest-idempotency");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:139}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/lock-policy",
(req,res)=>{
 res.json(buildLockPolicy({
  tableName:req.body.tableName,
  retentionDays:req.body.retentionDays,
  batchSize:req.body.batchSize
 }));
});

app.post("/api/security/delegation/baseline-alert/recovery-policy",
async(req,res)=>{
 const r=evaluatePolicy({
  severity:req.body.severity,
  consecutiveHealthy:Number(req.body.consecutiveHealthy)||0,
  recoveryCooldownUntil:req.body.recoveryCooldownUntil,
  escalationCount:Number(req.body.escalationCount)||0,
  escalationCap:Number(req.body.escalationCap)||3,
  now:req.body.now||new Date(),
  recoveryCycles:Number(req.body.recoveryCycles)||3,
  cooldownMs:Number(req.body.cooldownMs)||300000
 });

 try{
  await pool.query(
   `INSERT INTO alert_recovery_policy
    (alert_key,recovery_cooldown_until,
     escalation_count,escalation_cap)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(alert_key)
    DO UPDATE SET recovery_cooldown_until=
      EXCLUDED.recovery_cooldown_until,
      escalation_count=EXCLUDED.escalation_count,
      escalation_cap=EXCLUDED.escalation_cap,
      updated_at=NOW()`,
   [
    req.body.alertKey||"unknown",
    r.recoveryCooldownUntil||null,
    r.escalationCount||Number(req.body.escalationCount)||0,
    Number(req.body.escalationCap)||3
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/bind",
async(req,res)=>{
 const r=validateBinding({
  modelKey:req.body.modelKey,
  ownerId:req.body.ownerId,
  expectedOwnerId:req.body.expectedOwnerId,
  fencingVersion:req.body.fencingVersion,
  expectedFencingVersion:req.body.expectedFencingVersion,
  checkpointVersion:req.body.checkpointVersion
 });

 if(r.status==="BOUND"){
  try{
   await pool.query(
    `INSERT INTO calibration_checkpoint_bindings
     (model_key,fencing_version,checkpoint_version,owner_id)
     VALUES($1,$2,$3,$4)
     ON CONFLICT(model_key,fencing_version)
     DO UPDATE SET checkpoint_version=EXCLUDED.checkpoint_version,
       owner_id=EXCLUDED.owner_id`,
    [
     r.modelKey,r.fencingVersion,
     r.checkpointVersion,r.ownerId
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/governance/manifest/idempotent-verify",
async(req,res)=>{
 const key=req.body.idempotencyKey;
 if(!key) return res.status(400).json({
  status:"DENIED",reason:"missing_idempotency_key"
 });

 try{
  const existing=await pool.query(
   `SELECT export_id,result,payload_hash,manifest_hash
    FROM manifest_verification_idempotency
    WHERE idempotency_key=$1`,
   [key]
  );

  const mapped=existing.rowCount?{
   exportId:String(existing.rows[0].export_id),
   result:existing.rows[0].result,
   payloadHash:existing.rows[0].payload_hash,
   manifestHash:existing.rows[0].manifest_hash
  }:null;

  const decision=checkIdempotency(mapped,{
   exportId:req.body.exportId
  });

  if(decision.status!=="NEW")
    return res.json(decision);

  const result=req.body.result||"FAILED";

  await pool.query(
   `INSERT INTO manifest_verification_idempotency
    (idempotency_key,export_id,result,payload_hash,manifest_hash)
    VALUES($1,$2,$3,$4,$5)`,
   [
    key,
    req.body.exportId,
    result,
    req.body.payloadHash||"",
    req.body.manifestHash||""
   ]
  );

  res.json({
   status:"RECORDED",
   result,
   payloadHash:req.body.payloadHash||"",
   manifestHash:req.body.manifestHash||""
  });
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase139-dashboard",
async(_q,res)=>{
 try{
  const [rules,recovery,bindings,idempotency]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM purge_eligibility_rules
     WHERE enabled=true`),
    pool.query(`SELECT COUNT(*)::int count
     FROM alert_recovery_policy
     WHERE recovery_cooldown_until>NOW()`),
    pool.query(`SELECT COUNT(*)::int count
     FROM calibration_checkpoint_bindings
     WHERE bound_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM manifest_verification_idempotency
     WHERE created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   enabledPurgeRules:rules.rows[0].count,
   activeRecoveryCooldowns:recovery.rows[0].count,
   calibrationBindings30d:bindings.rows[0].count,
   idempotentManifestVerifications30d:idempotency.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 139 API running"
));
