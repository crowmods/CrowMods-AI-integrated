const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {evaluateApproval}=require("./redrive-policy");
const {classifyReplay}=require("./replay-safeguard");
const {updateHysteresis}=require("./burn-hysteresis");
const {updateBaseline}=require("./adaptive-baseline");
const {createAnchor}=require("./evidence-anchor");
const {buildReport}=require("./closure-report");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:148}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/reconciliation/redrive/approve",
async(req,res)=>{
 const r=evaluateApproval({
  policyEnabled:req.body.policyEnabled!==false,
  approvals:req.body.approvals,
  requiredApprovals:req.body.requiredApprovals||1,
  priorRedrives:req.body.priorRedrives||0,
  maxRedrives:req.body.maxRedrives||1,
  actorId:req.body.actorId,
  reason:req.body.reason
 });

 if(r.status!=="APPROVED")
  return res.json(r);

 try{
  await pool.query(
   `INSERT INTO redrive_approval_history
    (queue_id,policy_key,actor_id,decision,reason)
    VALUES($1,$2,$3,'APPROVED',$4)`,
   [
    req.body.queueId,
    req.body.policyKey||"default",
    r.actorId,
    r.reason
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/replay-safeguard",
async(req,res)=>{
 const key=req.body.idempotencyKey;
 if(!key)
  return res.status(400).json({
   state:"BLOCKED",
   reason:"missing_idempotency_key"
  });

 try{
  const q=await pool.query(
   `SELECT export_id,payload_hash,manifest_hash
    FROM manifest_verification_idempotency
    WHERE idempotency_key=$1`,
   [key]
  );

  const existing=q.rowCount?q.rows[0]:null;

  const r=classifyReplay({
   existingExportId:existing?
    String(existing.export_id):null,
   requestedExportId:req.body.exportId,
   payloadHash:req.body.payloadHash||"",
   existingPayloadHash:existing?.payload_hash||"",
   manifestHash:req.body.manifestHash||"",
   existingManifestHash:existing?.manifest_hash||""
  });

  await pool.query(
   `INSERT INTO replay_safeguard_events
    (idempotency_key,export_id,safeguard_state,
     payload_hash,manifest_hash)
    VALUES($1,$2,$3,$4,$5)`,
   [
    key,
    req.body.exportId,
    r.state,
    req.body.payloadHash||"",
    req.body.manifestHash||""
   ]
  );

  res.json(r);
 }catch{
  res.status(500).json({state:"FAILED"});
 }
});

app.post("/api/security/delegation/recovery-slo/hysteresis",
async(req,res)=>{
 const r=updateHysteresis({
  currentSeverity:req.body.currentSeverity,
  candidateSeverity:req.body.candidateSeverity,
  breachCycles:req.body.breachCycles,
  recoveryCycles:req.body.recoveryCycles,
  breachThreshold:req.body.breachThreshold||2,
  recoveryThreshold:req.body.recoveryThreshold||3
 });

 try{
  await pool.query(
   `INSERT INTO burn_rate_hysteresis_state
    (alert_class,severity,breach_cycles,recovery_cycles)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(alert_class)
    DO UPDATE SET severity=EXCLUDED.severity,
      breach_cycles=EXCLUDED.breach_cycles,
      recovery_cycles=EXCLUDED.recovery_cycles,
      updated_at=NOW()`,
   [
    req.body.alertClass||"UNKNOWN",
    r.severity,r.breachCycles,r.recoveryCycles
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/adaptive-baseline",
async(req,res)=>{
 const r=updateBaseline({
  baselineRate:req.body.baselineRate,
  observedRate:req.body.observedRate,
  sampleCount:req.body.sampleCount,
  alpha:req.body.alpha||.20
 });

 try{
  await pool.query(
   `INSERT INTO adaptive_lease_baselines
    (model_key,baseline_rate,sample_count,alpha)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(model_key)
    DO UPDATE SET baseline_rate=EXCLUDED.baseline_rate,
      sample_count=EXCLUDED.sample_count,
      alpha=EXCLUDED.alpha,
      updated_at=NOW()`,
   [
    req.body.modelKey||"unknown",
    r.baselineRate,
    r.sampleCount,
    Number(req.body.alpha)||.20
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/governance/quarantine/anchor",
async(req,res)=>{
 const r=createAnchor({
  quarantineId:req.body.quarantineId,
  chainHeadHash:req.body.chainHeadHash,
  previousAnchorHash:req.body.previousAnchorHash||null,
  anchorVersion:req.body.anchorVersion||1,
  anchoredBy:req.body.anchoredBy
 });

 if(r.status!=="ANCHORED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO evidence_chain_anchors
    (quarantine_id,chain_head_hash,anchor_hash,
     anchor_version,anchored_by)
    VALUES($1,$2,$3,$4,$5)`,
   [
    r.quarantineId,r.chainHeadHash,r.anchorHash,
    r.anchorVersion,r.anchoredBy
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/quarantine/closure-report",
async(req,res)=>{
 const r=buildReport({
  quarantineId:req.body.quarantineId,
  verification:req.body.verification,
  verifiedBy:req.body.verifiedBy
 });

 if(r.status!=="READY")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO closure_verification_reports
    (quarantine_id,valid,chain_length,
     head_hash,report_hash,verified_by)
    VALUES($1,$2,$3,$4,$5,$6)`,
   [
    r.quarantineId,r.valid,r.chainLength,
    r.headHash,r.reportHash,r.verifiedBy
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase148-dashboard",
async(_q,res)=>{
 try{
  const [approvals,replay,hysteresis,anchors,reports]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM redrive_approval_history
     WHERE decision='APPROVED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM replay_safeguard_events
     WHERE safeguard_state IN ('CONFLICT','BLOCKED')
     AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM burn_rate_hysteresis_state
     WHERE severity='CRITICAL'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM evidence_chain_anchors
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM closure_verification_reports
     WHERE valid=true
     AND created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   approvedRedrives30d:approvals.rows[0].count,
   replaySafeguardBlocks24h:replay.rows[0].count,
   criticalHysteresisStates:hysteresis.rows[0].count,
   evidenceAnchors30d:anchors.rows[0].count,
   validClosureReports30d:reports.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 148 API running"
));
