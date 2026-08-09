const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {evaluateQuorum}=require("./quorum");
const {checkRateLimit}=require("./replay-rate-limit");
const {validatePolicy}=require("./hysteresis-policy");
const {updateWithDriftControl}=require("./baseline-drift");
const {verifyWithAdapter}=require("./evidence-adapter");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:149}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/reconciliation/quorum",
async(req,res)=>{
 const r=evaluateQuorum({
  approvals:req.body.approvals||[],
  requiredApprovals:req.body.requiredApprovals||2,
  now:req.body.now||new Date()
 });

 try{
  for(const a of req.body.approvals||[]){
   await pool.query(
    `INSERT INTO approval_quorum_history
     (queue_id,policy_key,approval_id,actor_id,
      decision,expires_at)
     VALUES($1,$2,$3,$4,$5,$6)`,
    [
     req.body.queueId,
     req.body.policyKey||"default",
     a.approvalId||`${a.actorId}:${Date.now()}`,
     a.actorId,
     a.decision,
     a.expiresAt
    ]
   );
  }
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/replay-rate-limit",
async(req,res)=>{
 const key=req.body.idempotencyKey;
 if(!key)
  return res.status(400).json({
   state:"ESCALATED",
   reason:"missing_idempotency_key"
  });

 try{
  const q=await pool.query(
   `SELECT request_count,limit_count
    FROM replay_rate_limit_state
    WHERE idempotency_key=$1`,
   [key]
  );

  const current=q.rowCount?q.rows[0]:
   {request_count:0,limit_count:req.body.limitCount||5};

  const r=checkRateLimit({
   requestCount:Number(current.request_count)+1,
   limitCount:Number(current.limit_count)||5,
   escalationThreshold:req.body.escalationThreshold||2
  });

  await pool.query(
   `INSERT INTO replay_rate_limit_state
    (idempotency_key,window_start,request_count,
     limit_count,state)
    VALUES($1,NOW(),$2,$3,$4)
    ON CONFLICT(idempotency_key)
    DO UPDATE SET request_count=EXCLUDED.request_count,
      state=EXCLUDED.state,updated_at=NOW()`,
   [
    key,
    r.requestCount,
    r.limitCount,
    r.state
   ]
  );

  res.json(r);
 }catch{
  res.status(500).json({state:"ESCALATED"});
 }
});

app.post("/api/security/delegation/recovery-slo/policy",
async(req,res)=>{
 const r=validatePolicy({
  version:req.body.version,
  breachThreshold:req.body.breachThreshold,
  recoveryThreshold:req.body.recoveryThreshold
 });

 if(r.status!=="VALID")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO hysteresis_policy_versions
    (policy_key,version,breach_threshold,
     recovery_threshold,enabled)
    VALUES($1,$2,$3,$4,TRUE)
    ON CONFLICT(policy_key,version)
    DO UPDATE SET enabled=TRUE`,
   [
    req.body.policyKey||"default",
    r.version,
    r.breachThreshold,
    r.recoveryThreshold
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/baseline-drift",
async(req,res)=>{
 const r=updateWithDriftControl({
  baselineRate:req.body.baselineRate,
  candidateRate:req.body.candidateRate,
  minRate:req.body.minRate??0,
  maxRate:req.body.maxRate??1,
  maxStep:req.body.maxStep??.05
 });

 try{
  await pool.query(
   `INSERT INTO adaptive_lease_baselines
    (model_key,baseline_rate,sample_count,alpha)
    VALUES($1,$2,1,.20)
    ON CONFLICT(model_key)
    DO UPDATE SET baseline_rate=EXCLUDED.baseline_rate,
      sample_count=adaptive_lease_baselines.sample_count+1,
      updated_at=NOW()`,
   [req.body.modelKey||"unknown",r.baselineRate]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/governance/quarantine/external-verify",
async(req,res)=>{
 const adapter=globalThis[
  `crowmodsEvidenceAdapter:${req.body.adapterKey||""}`
 ];

 const r=verifyWithAdapter({
  adapterKey:req.body.adapterKey,
  evidenceHash:req.body.evidenceHash,
  adapter:typeof adapter==="function"?adapter:null
 });

 try{
  await pool.query(
   `INSERT INTO evidence_external_verification
    (quarantine_id,adapter_key,evidence_hash,
     verification_state,adapter_reference)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.quarantineId,
    req.body.adapterKey||"unknown",
    req.body.evidenceHash||"",
    r.state,
    req.body.adapterReference||null
   ]
  );
 }catch{}

 res.json(r);
});

app.get("/api/security/phase149-dashboard",
async(_q,res)=>{
 try{
  const [quorum,rate,policies,drift,external]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM approval_quorum_history
     WHERE decision='APPROVE'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM replay_rate_limit_state
     WHERE state IN ('THROTTLED','ESCALATED')`),
    pool.query(`SELECT COUNT(*)::int count
     FROM hysteresis_policy_versions
     WHERE enabled=true`),
    pool.query(`SELECT COUNT(*)::int count
     FROM adaptive_lease_baselines
     WHERE updated_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM evidence_external_verification
     WHERE verification_state='VERIFIED'
     AND created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   quorumApprovals30d:quorum.rows[0].count,
   replayThrottlesOrEscalations:rate.rows[0].count,
   activeHysteresisPolicies:policies.rows[0].count,
   adaptiveBaselinesUpdated30d:drift.rows[0].count,
   externalEvidenceVerifications30d:external.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 149 API running"
));
