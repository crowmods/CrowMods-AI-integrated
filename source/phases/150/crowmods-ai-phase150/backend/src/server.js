const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");

const {
 evaluateApproval,
 revokeApproval
}=require("./approval-expiry");

const {
 evaluateSlidingWindow
}=require("./sliding-replay");

const {
 transitionPolicy
}=require("./policy-rollout");

const {
 calculateConfidence
}=require("./confidence");

const {
 createAttestation,
 verifyAttestation
}=require("./attestation");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({
 status:"healthy",
 phase:150
}));

app.get("/ready",async(_q,s)=>{
 try{
  await pool.query("SELECT 1");
  s.json({ready:true});
 }catch{
  s.status(503).json({ready:false});
 }
});

app.post("/api/security/governance/reconciliation/approval-expiry",
async(req,res)=>{
 const r=evaluateApproval({
  decision:req.body.decision,
  expiresAt:req.body.expiresAt,
  now:req.body.now||new Date()
 });

 if(r.state==="EXPIRED"){
  try{
   await pool.query(
    `INSERT INTO approval_revocation_history
     (queue_id,approval_id,actor_id,action,reason)
     VALUES($1,$2,$3,'EXPIRE',$4)`,
    [
     req.body.queueId,
     req.body.approvalId,
     req.body.actorId||"system",
     "approval_expired"
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/governance/reconciliation/revoke-approval",
async(req,res)=>{
 const r=revokeApproval({
  approvalId:req.body.approvalId,
  actorId:req.body.actorId,
  reason:req.body.reason
 });

 if(r.status!=="REVOKED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO approval_revocation_history
    (queue_id,approval_id,actor_id,action,reason)
    VALUES($1,$2,$3,'REVOKE',$4)`,
   [
    req.body.queueId,
    r.approvalId,
    r.actorId,
    r.reason
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/sliding-rate-limit",
async(req,res)=>{
 const key=req.body.idempotencyKey;

 if(!key)
  return res.status(400).json({
   state:"ESCALATED",
   reason:"missing_idempotency_key"
  });

 try{
  const q=await pool.query(
   `SELECT window_start,window_seconds,
    request_count,limit_count
    FROM replay_sliding_windows
    WHERE idempotency_key=$1`,
   [key]
  );

  const current=q.rowCount?q.rows[0]:{
   window_start:new Date(),
   window_seconds:req.body.windowSeconds||60,
   request_count:0,
   limit_count:req.body.limitCount||5
  };

  const r=evaluateSlidingWindow({
   windowStart:current.window_start,
   now:req.body.now||new Date(),
   windowSeconds:Number(current.window_seconds),
   requestCount:Number(current.request_count),
   limitCount:Number(current.limit_count),
   escalationMultiplier:req.body.escalationMultiplier||2
  });

  await pool.query(
   `INSERT INTO replay_sliding_windows
    (idempotency_key,window_start,window_seconds,
     request_count,limit_count,state)
    VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(idempotency_key)
    DO UPDATE SET request_count=EXCLUDED.request_count,
      state=EXCLUDED.state,
      updated_at=NOW()`,
   [
    key,
    r.windowReset?new Date():current.window_start,
    Number(current.window_seconds),
    r.requestCount||1,
    Number(current.limit_count),
    r.state
   ]
  );

  res.json(r);
 }catch{
  res.status(500).json({state:"ESCALATED"});
 }
});

app.post("/api/security/delegation/recovery-slo/policy-rollout",
async(req,res)=>{
 const r=transitionPolicy({
  currentState:req.body.currentState,
  action:req.body.action,
  actorId:req.body.actorId,
  reason:req.body.reason
 });

 if(r.status!=="ACCEPTED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO hysteresis_policy_rollouts
    (policy_key,version,state,actor_id,reason)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(policy_key,version)
    DO UPDATE SET state=EXCLUDED.state,
      actor_id=EXCLUDED.actor_id,
      reason=EXCLUDED.reason`,
   [
    req.body.policyKey||"default",
    Number(req.body.version),
    r.state,
    r.actorId,
    r.reason
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/risk/calibration/confidence",
async(req,res)=>{
 const r=calculateConfidence({
  samples:req.body.samples||[],
  z:req.body.z||1.96
 });

 try{
  await pool.query(
   `INSERT INTO baseline_confidence_samples
    (model_key,sample_count,mean_rate,variance,
     lower_bound,upper_bound)
    VALUES($1,$2,$3,$4,$5,$6)`,
   [
    req.body.modelKey||"unknown",
    r.sampleCount,
    r.meanRate,
    r.variance,
    r.lowerBound,
    r.upperBound
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/governance/quarantine/attestation",
async(req,res)=>{
 const r=createAttestation({
  evidenceHash:req.body.evidenceHash,
  algorithm:req.body.algorithm||"SHA256-DIGEST",
  signerReference:req.body.signerReference
 });

 if(r.status!=="CREATED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO evidence_attestations
    (quarantine_id,evidence_hash,
     attestation_algorithm,attestation,
     signer_reference,verification_state)
    VALUES($1,$2,$3,$4,$5,'PENDING')`,
   [
    req.body.quarantineId,
    r.evidenceHash,
    r.algorithm,
    r.attestation,
    r.signerReference
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/quarantine/attestation/verify",
async(req,res)=>{
 const r=verifyAttestation({
  evidenceHash:req.body.evidenceHash,
  algorithm:req.body.algorithm,
  signerReference:req.body.signerReference,
  attestation:req.body.attestation
 });

 try{
  await pool.query(
   `UPDATE evidence_attestations
    SET verification_state=$1
    WHERE quarantine_id=$2
      AND evidence_hash=$3`,
   [
    r.state,
    req.body.quarantineId,
    req.body.evidenceHash
   ]
  );
 }catch{}

 res.json(r);
});

app.get("/api/security/phase150-dashboard",
async(_q,res)=>{
 try{
  const [expiry,rate,rollouts,confidence,attestations]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM approval_revocation_history
     WHERE action='EXPIRE'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM replay_sliding_windows
     WHERE state IN ('THROTTLED','ESCALATED')`),
    pool.query(`SELECT COUNT(*)::int count
     FROM hysteresis_policy_rollouts
     WHERE state='ACTIVE'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM baseline_confidence_samples
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM evidence_attestations
     WHERE verification_state='VERIFIED'
     AND created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   approvalsExpired30d:expiry.rows[0].count,
   replaySlidingWindowsThrottledOrEscalated:rate.rows[0].count,
   activeHysteresisRollouts:rollouts.rows[0].count,
   confidenceSamples30d:confidence.rows[0].count,
   verifiedAttestations30d:attestations.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 150 API running"
));
