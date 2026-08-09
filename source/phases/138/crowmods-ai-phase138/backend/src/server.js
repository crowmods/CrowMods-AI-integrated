const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {validateBatch}=require("./purge-transaction");
const {evaluateRecovery}=require("./alert-recovery");
const {buildFencedAudit}=require("./fenced-audit");
const {verifyTransaction}=require("./manifest-transaction");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:138}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/transaction",
async(req,res)=>{
 const validation=validateBatch({
  tableName:req.body.tableName,
  retentionDays:req.body.retentionDays,
  batchSize:req.body.batchSize
 });

 if(validation.status!=="AUTHORIZED")
   return res.status(403).json(validation);

 const client=await pool.connect();
 try{
  await client.query("BEGIN");

  const q=await client.query(
   `SELECT * FROM execute_purge_batch(
    $1,$2,$3,$4
   )`,
   [
    req.body.runId,
    validation.tableName,
    validation.retentionDays,
    validation.batchSize
   ]
  );

  const row=q.rows[0]||{
   examined_count:0,
   purged_count:0
  };

  await client.query(
   `INSERT INTO purge_execution_transactions
    (run_id,table_name,examined_count,
     purged_count,skipped_count,result)
    VALUES($1,$2,$3,$4,$5,'COMMITTED')`,
   [
    req.body.runId,
    validation.tableName,
    Number(row.examined_count)||0,
    Number(row.purged_count)||0,
    Math.max(
     0,
     Number(row.examined_count||0)-
     Number(row.purged_count||0)
    )
   ]
  );

  await client.query("COMMIT");

  res.json({
   status:"COMMITTED",
   examinedCount:Number(row.examined_count)||0,
   purgedCount:Number(row.purged_count)||0
  });
 }catch{
  await client.query("ROLLBACK");
  res.status(500).json({status:"ROLLED_BACK"});
 }finally{
  client.release();
 }
});

app.post("/api/security/delegation/baseline-alert/recovery",
async(req,res)=>{
 const r=evaluateRecovery({
  severity:req.body.severity,
  consecutiveHits:Number(req.body.consecutiveHits)||0,
  consecutiveHealthy:Number(
   req.body.consecutiveHealthy
  )||0,
  warningHits:Number(req.body.warningHits)||2,
  criticalHits:Number(req.body.criticalHits)||4,
  recoveryCycles:Number(req.body.recoveryCycles)||3
 });

 try{
  await pool.query(
   `INSERT INTO alert_escalation_history
    (alert_key,from_severity,to_severity,
     action,consecutive_hits)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.alertKey||"unknown",
    req.body.severity||"NORMAL",
    r.severity,
    r.action,
    Number(req.body.consecutiveHits)||0
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/fenced-audit",
async(req,res)=>{
 const r=buildFencedAudit({
  modelKey:req.body.modelKey,
  ownerId:req.body.ownerId,
  fencingVersion:req.body.fencingVersion,
  checkpointVersion:req.body.checkpointVersion,
  result:req.body.result
 });

 if(r.status==="READY"){
  try{
   await pool.query(
    `INSERT INTO calibration_fenced_audit
     (model_key,owner_id,fencing_version,
      checkpoint_version,result)
     VALUES($1,$2,$3,$4,$5)`,
    [
     r.modelKey,r.ownerId,r.fencingVersion,
     r.checkpointVersion,r.result
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/governance/manifest/verify-transaction",
async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");

  const r=verifyTransaction({
   reviewer:req.body.reviewer,
   workerId:req.body.workerId,
   exportId:req.body.exportId,
   events:req.body.events||[],
   expectedPayloadHash:req.body.expectedPayloadHash,
   expectedManifestHash:req.body.expectedManifestHash
  });

  await client.query(
   `INSERT INTO manifest_verification_transactions
    (export_id,worker_id,payload_hash,
     manifest_hash,result)
    VALUES($1,$2,$3,$4,$5)`,
   [
    req.body.exportId,
    req.body.workerId||"system",
    r.payloadHash,
    r.manifestHash,
    r.result
   ]
  );

  await client.query("COMMIT");
  res.json(r);
 }catch{
  await client.query("ROLLBACK");
  res.status(500).json({result:"FAILED"});
 }finally{
  client.release();
 }
});

app.get("/api/security/phase138-dashboard",
async(_q,res)=>{
 try{
  const [purge,recovery,audit,manifest]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM purge_execution_transactions
     WHERE result='COMMITTED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM alert_escalation_history
     WHERE action IN ('RECOVER','RESET')
     AND created_at>NOW()-INTERVAL '24 hours'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM calibration_fenced_audit
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM manifest_verification_transactions
     WHERE result='VERIFIED'
     AND created_at>NOW()-INTERVAL '30 days'`)
   ]);

  res.json({
   committedPurgeTransactions30d:purge.rows[0].count,
   alertRecoveries24h:recovery.rows[0].count,
   calibrationFencedAudits30d:audit.rows[0].count,
   verifiedManifestTransactions30d:manifest.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 138 API running"
));
