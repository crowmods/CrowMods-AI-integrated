const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildRowAudit}=require("./purge-audit-binding");
const {transition}=require("./alert-state-machine");
const calibration=require("./atomic-calibration");
const {getCached}=require("./replay-cache");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:141}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/row-audit",
async(req,res)=>{
 const r=buildRowAudit({
  runId:req.body.runId,
  tableName:req.body.tableName,
  recordKey:req.body.recordKey,
  retentionDays:req.body.retentionDays,
  action:req.body.action||"PURGED"
 });

 if(r.status==="READY"){
  try{
   await pool.query(
    `INSERT INTO purge_row_binding_audit
     (run_id,table_name,record_key,retention_days,action)
     VALUES($1,$2,$3,$4,$5)`,
    [
     r.runId,r.tableName,r.recordKey,
     r.retentionDays,r.action
    ]
   );
  }catch{}
 }

 res.json(r);
});

app.post("/api/security/delegation/baseline-alert/state",
async(req,res)=>{
 const r=transition({
  state:req.body.state,
  escalationCount:req.body.escalationCount,
  cap:req.body.cap||3,
  healthyCycles:req.body.healthyCycles,
  warningHits:req.body.warningHits||2,
  criticalHits:req.body.criticalHits||4,
  recoveryCycles:req.body.recoveryCycles||3
 });

 try{
  await pool.query(
   `INSERT INTO alert_cap_state_machine
    (alert_key,state,escalation_count,cap,
     healthy_cycles,reset_at)
    VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '1 hour')
    ON CONFLICT(alert_key)
    DO UPDATE SET state=EXCLUDED.state,
      escalation_count=EXCLUDED.escalation_count,
      cap=EXCLUDED.cap,
      healthy_cycles=EXCLUDED.healthy_cycles,
      reset_at=EXCLUDED.reset_at,
      updated_at=NOW()`,
   [
    req.body.alertKey||"unknown",
    r.state,
    r.escalationCount,
    Number(req.body.cap)||3,
    Number(req.body.healthyCycles)||0
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/atomic-commit",
async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query("BEGIN");

  const r=await calibration.commit(client,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   fencingVersion:Number(req.body.fencingVersion),
   expectedCheckpoint:Number(
    req.body.expectedCheckpoint
   ),
   action:req.body.action||"HOLD",
   windowSize:Number(req.body.windowSize)||100
  });

  await client.query(
   `INSERT INTO calibration_atomic_commits
    (model_key,owner_id,fencing_version,
     old_checkpoint_version,new_checkpoint_version,
     action,result)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [
    req.body.modelKey,
    req.body.ownerId,
    Number(req.body.fencingVersion),
    Number(req.body.expectedCheckpoint),
    r.newCheckpointVersion||
      Number(req.body.expectedCheckpoint),
    req.body.action||"HOLD",
    r.status
   ]
  );

  await client.query("COMMIT");
  res.json(r);
 }catch{
  await client.query("ROLLBACK");
  res.status(500).json({status:"FAILED"});
 }finally{
  client.release();
 }
});

app.post("/api/security/governance/manifest/replay-cache",
async(req,res)=>{
 const key=req.body.idempotencyKey;
 if(!key)
  return res.status(400).json({
   status:"DENIED",reason:"missing_idempotency_key"
  });

 try{
  const q=await pool.query(
   `SELECT export_id,response_json,expires_at
    FROM manifest_replay_cache
    WHERE idempotency_key=$1`,
   [key]
  );

  if(q.rowCount){
   const cached=getCached({
    expiresAt:q.rows[0].expires_at,
    response:q.rows[0].response_json
   });

   if(cached.status==="HIT")
    return res.json({
     status:"REPLAY",
     response:cached.response
    });
  }

  const response={
   result:req.body.result||"FAILED",
   exportId:req.body.exportId,
   payloadHash:req.body.payloadHash||"",
   manifestHash:req.body.manifestHash||""
  };

  await pool.query(
   `INSERT INTO manifest_replay_cache
    (idempotency_key,export_id,response_json,expires_at)
    VALUES($1,$2,$3,NOW()+INTERVAL '24 hours')
    ON CONFLICT(idempotency_key)
    DO UPDATE SET response_json=EXCLUDED.response_json,
      expires_at=EXCLUDED.expires_at`,
   [
    key,req.body.exportId,JSON.stringify(response)
   ]
  );

  res.json({status:"STORED",response});
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase141-dashboard",
async(_q,res)=>{
 try{
  const [purge,alerts,calibration,replay]=
   await Promise.all([
    pool.query(`SELECT COUNT(*)::int count
     FROM purge_row_binding_audit
     WHERE created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM alert_cap_state_machine
     WHERE state IN ('CRITICAL','CAPPED')`),
    pool.query(`SELECT COUNT(*)::int count
     FROM calibration_atomic_commits
     WHERE result='COMMITTED'
     AND created_at>NOW()-INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*)::int count
     FROM manifest_replay_cache
     WHERE expires_at>NOW()`)
   ]);

  res.json({
   purgeRowAudits30d:purge.rows[0].count,
   activeCriticalOrCappedAlerts:alerts.rows[0].count,
   atomicCalibrationCommits30d:calibration.rows[0].count,
   activeReplayCacheEntries:replay.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 141 API running"
));
