const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {authorizePurge,buildPurgeAudit}=require("./transactional-purge");
const {classifyBaseline}=require("./baseline-alert");
const {validateLease}=require("./calibration-lease");
const {reverify}=require("./manifest-reverify");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:135}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/authorize-purge",
async(req,res)=>{
 const r=authorizePurge({
  role:req.body.role,
  table:req.body.table,
  action:"PURGE"
 });
 if(r.status!=="AUTHORIZED") return res.status(403).json(r);

 const rows=req.body.records||[];
 const runId=req.body.runId;

 const client=await pool.connect();
 try{
  await client.query("BEGIN");

  let purged=0;
  for(const row of rows.slice(0,Math.min(100,rows.length))){
   const audit=buildPurgeAudit({
    runId,
    table:req.body.table,
    recordKey:row.key,
    action:"PURGED",
    actor:req.body.role
   });

   if(audit.status!=="READY")
    throw new Error("invalid_purge_audit");

   await client.query(
    `INSERT INTO purge_row_audit
     (run_id,table_name,record_key,action,actor)
     VALUES($1,$2,$3,$4,$5)`,
    [
     runId,
     req.body.table,
     audit.recordKey,
     audit.action,
     audit.actor
    ]
   );

   purged++;
  }

  await client.query(
   `INSERT INTO retention_execution_audit
    (policy_key,handler_key,run_id,requested_by,
     examined_count,purged_count,result)
    VALUES($1,$2,$3,$4,$5,$6,'COMPLETED')`,
   [
    req.body.policyKey||"default",
    req.body.table,
    runId,
    req.body.role,
    rows.length,
    purged
   ]
  );

  await client.query("COMMIT");
  res.json({status:"COMPLETED",examined:rows.length,purged});
 }catch{
  await client.query("ROLLBACK");
  res.status(500).json({status:"FAILED"});
 }finally{
  client.release();
 }
});

app.post("/api/security/delegation/baseline-alert",
async(req,res)=>{
 const r=classifyBaseline({
  currentP95:req.body.currentP95,
  baselineP95:req.body.baselineP95,
  warningRatio:Number(req.body.warningRatio)||1.25,
  criticalRatio:Number(req.body.criticalRatio)||1.75
 });

 try{
  await pool.query(
   `INSERT INTO retry_baseline_alerts
    (run_key,baseline_p95_ms,current_p95_ms,
     deviation_ratio,severity)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.runKey||"unknown",
    Number(req.body.baselineP95),
    Number(req.body.currentP95),
    r.deviationRatio,
    r.severity
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/lease/validate",
(req,res)=>{
 const r=validateLease({
  ownerId:req.body.ownerId,
  expectedOwnerId:req.body.expectedOwnerId,
  leaseToken:req.body.leaseToken,
  expectedLeaseToken:req.body.expectedLeaseToken,
  fencingVersion:Number(req.body.fencingVersion),
  expectedFencingVersion:Number(
   req.body.expectedFencingVersion
  ),
  leaseExpiresAt:req.body.leaseExpiresAt,
  now:req.body.now||new Date()
 });
 res.json(r);
});

app.post("/api/security/governance/manifest/reverify",
async(req,res)=>{
 const r=reverify({
  reviewer:req.body.reviewer,
  events:req.body.events||[],
  expectedPayloadHash:req.body.expectedPayloadHash,
  expectedManifestHash:req.body.expectedManifestHash
 });

 try{
  await pool.query(
   `INSERT INTO manifest_reverification_runs
    (export_id,result,payload_hash,manifest_hash)
    VALUES($1,$2,$3,$4)`,
   [
    req.body.exportId,
    r.result,
    r.payloadHash,
    r.manifestHash
   ]
  );
 }catch{}

 res.json(r);
});

app.get("/api/security/phase135-dashboard",
async(_q,res)=>{
 try{
  const [purges,alerts,leases,manifests]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
      FROM purge_row_audit
      WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
      FROM retry_baseline_alerts
      WHERE severity IN ('WARNING','CRITICAL')
      AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
      FROM calibration_checkpoint_leases
      WHERE lease_expires_at>NOW()`),
    pool.query(`SELECT COUNT(*)::int count
      FROM manifest_reverification_runs
      WHERE result='VERIFIED'
      AND created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   purgeRowAudits30d:purges.rows[0].count,
   baselineAlerts24h:alerts.rows[0].count,
   activeCalibrationLeases:leases.rows[0].count,
   verifiedRechecks30d:manifests.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 135 API running"
));
