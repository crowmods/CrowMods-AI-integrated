const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildRepairItem,claim}=require("./repair-queue");
const {aggregate}=require("./slo-aggregate");
const {buildAudit}=require("./lease-fencing-audit");
const {resolve}=require("./quarantine-resolution");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:144}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/reconciliation/repair",
async(req,res)=>{
 const r=buildRepairItem({
  runId:req.body.runId,
  recordKey:req.body.recordKey,
  mismatchType:req.body.mismatchType
 });

 if(r.status!=="READY")
  return res.status(400).json(r);

 try{
  const q=await pool.query(
   `INSERT INTO reconciliation_repair_queue
    (run_id,record_key,mismatch_type,status)
    VALUES($1,$2,$3,'OPEN')
    RETURNING id`,
   [r.runId,r.recordKey,r.mismatchType]
  );
  res.json({...r,queueId:q.rows[0].id});
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/reconciliation/claim",
async(req,res)=>{
 try{
  const q=await pool.query(
   `SELECT id,status,attempts
    FROM reconciliation_repair_queue
    WHERE id=$1
    FOR UPDATE SKIP LOCKED`,
   [req.body.queueId]
  );

  if(!q.rowCount)
   return res.status(409).json({status:"CONFLICT"});

  const r=claim(q.rows[0],req.body.workerId);

  if(r.status==="CLAIMED"){
   await pool.query(
    `UPDATE reconciliation_repair_queue
     SET status='CLAIMED',claimed_by=$1,attempts=$2
     WHERE id=$3`,
    [r.claimedBy,r.attempts,req.body.queueId]
   );
  }

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/delegation/recovery-slo/aggregate",
async(req,res)=>{
 const samples=req.body.samples||[];
 const r=aggregate(samples,{
  periodStart:req.body.periodStart,
  periodEnd:req.body.periodEnd,
  alertClass:req.body.alertClass||"UNKNOWN"
 });

 try{
  await pool.query(
   `INSERT INTO recovery_slo_aggregates
    (period_start,period_end,alert_class,
     sample_count,met_count,missed_count,
     open_count,compliance_ratio)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
   [
    req.body.periodStart,
    req.body.periodEnd,
    r.alertClass,
    r.sampleCount,
    r.metCount,
    r.missedCount,
    r.openCount,
    r.complianceRatio
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/lease-audit",
async(req,res)=>{
 const r=buildAudit({
  modelKey:req.body.modelKey,
  ownerId:req.body.ownerId,
  fencingVersion:req.body.fencingVersion,
  leaseToken:req.body.leaseToken,
  oldExpiry:req.body.oldExpiry,
  newExpiry:req.body.newExpiry,
  result:req.body.result||"RENEWED"
 });

 if(r.status==="READY"){
  try{
   await pool.query(
    `INSERT INTO lease_renewal_fencing_audit
     (model_key,owner_id,fencing_version,
      lease_token_hash,old_expiry,new_expiry,result)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [
     r.modelKey,r.ownerId,r.fencingVersion,
     r.leaseTokenHash,r.oldExpiry,r.newExpiry,r.result
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/governance/quarantine/resolve",
async(req,res)=>{
 const r=resolve({
  quarantineId:req.body.quarantineId,
  operatorId:req.body.operatorId,
  decision:req.body.decision,
  reason:req.body.reason
 });

 if(r.status!=="RESOLVED")
  return res.status(400).json(r);

 try{
  await pool.query("BEGIN");
  await pool.query(
   `INSERT INTO quarantine_resolution_history
    (quarantine_id,operator_id,decision,reason)
    VALUES($1,$2,$3,$4)`,
   [r.quarantineId,r.operatorId,r.decision,r.reason]
  );

  await pool.query(
   `UPDATE replay_conflict_quarantine
    SET resolved_at=NOW()
    WHERE id=$1`,
   [r.quarantineId]
  );
  await pool.query("COMMIT");

  res.json(r);
 }catch{
  await pool.query("ROLLBACK");
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase144-dashboard",
async(_q,res)=>{
 try{
  const [repairs,slo,leases,quarantine]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM reconciliation_repair_queue
     WHERE status='OPEN'`),
    pool.query(`SELECT COALESCE(AVG(compliance_ratio),0)::numeric(8,5) ratio
     FROM recovery_slo_aggregates
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM lease_renewal_fencing_audit
     WHERE result='RENEWED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM replay_conflict_quarantine
     WHERE resolved_at IS NULL`)
   ]);

  res.json({
   openRepairQueue:repairs.rows[0].count,
   recoverySLOCompliance30d:Number(slo.rows[0].ratio),
   leaseRenewalAudits30d:leases.rows[0].count,
   unresolvedQuarantine:quarantine.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 144 API running"
));


module.exports = app;
