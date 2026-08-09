const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildDeleteRequest}=require("./purge-delete");
const {evaluateCap}=require("./alert-cap-reset");
const calibration=require("./calibration-binding-cas");
const {classifyReplay}=require("./manifest-replay");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:140}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/retention/delete-request",
(req,res)=>{
 res.json(buildDeleteRequest({
  tableName:req.body.tableName,
  retentionDays:req.body.retentionDays,
  batchSize:req.body.batchSize
 }));
});

app.post("/api/security/delegation/baseline-alert/cap",
async(req,res)=>{
 const r=evaluateCap({
  escalationCount:req.body.escalationCount,
  cap:req.body.cap||3,
  resetAt:req.body.resetAt,
  now:req.body.now||new Date(),
  resetWindowMs:Number(req.body.resetWindowMs)||3600000
 });

 try{
  await pool.query(
   `INSERT INTO alert_cap_windows
    (alert_key,escalation_count,cap,reset_at)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(alert_key)
    DO UPDATE SET escalation_count=EXCLUDED.escalation_count,
      cap=EXCLUDED.cap,
      reset_at=EXCLUDED.reset_at,
      updated_at=NOW()`,
   [
    req.body.alertKey||"unknown",
    r.escalationCount,
    Number(req.body.cap)||3,
    r.resetAt
   ]
  );
 }catch{}

 res.json(r);
});

app.post("/api/security/risk/calibration/bind-cas",
async(req,res)=>{
 try{
  res.json(await calibration.bind(pool,{
   modelKey:req.body.modelKey,
   ownerId:req.body.ownerId,
   fencingVersion:Number(req.body.fencingVersion),
   expectedFencingVersion:Number(
    req.body.expectedFencingVersion
   ),
   checkpointVersion:Number(req.body.checkpointVersion)
  }));
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/manifest/replay",
async(req,res)=>{
 const key=req.body.idempotencyKey;
 if(!key)
  return res.status(400).json({
   action:"DENIED",reason:"missing_idempotency_key"
  });

 try{
  const q=await pool.query(
   `SELECT export_id,result,payload_hash,manifest_hash
    FROM manifest_verification_idempotency
    WHERE idempotency_key=$1`,
   [key]
  );

  const existing=q.rowCount?{
   exportId:String(q.rows[0].export_id),
   result:q.rows[0].result,
   payloadHash:q.rows[0].payload_hash,
   manifestHash:q.rows[0].manifest_hash
  }:null;

  const decision=classifyReplay(existing,{
   exportId:req.body.exportId
  });

  if(decision.action==="NEW"){
   await pool.query(
    `INSERT INTO manifest_verification_idempotency
     (idempotency_key,export_id,result,
      payload_hash,manifest_hash)
     VALUES($1,$2,$3,$4,$5)`,
    [
     key,req.body.exportId,
     req.body.result||"FAILED",
     req.body.payloadHash||"",
     req.body.manifestHash||""
    ]
   );
  }

  await pool.query(
   `INSERT INTO manifest_replay_audit
    (idempotency_key,export_id,action,result)
    VALUES($1,$2,$3,$4)`,
   [
    key,req.body.exportId,
    decision.action,
    decision.result||req.body.result||"FAILED"
   ]
  );

  res.json(decision);
 }catch{
  res.status(500).json({action:"FAILED"});
 }
});

app.get("/api/security/phase140-dashboard",
async(_q,res)=>{
 try{
  const [caps,bindings,replays]=await Promise.all([
   pool.query(`SELECT COUNT(*)::int count
    FROM alert_cap_windows
    WHERE reset_at>NOW()`),
   pool.query(`SELECT COUNT(*)::int count
    FROM calibration_binding_cas`),
   pool.query(`SELECT COUNT(*)::int count
    FROM manifest_replay_audit
    WHERE created_at>NOW()-INTERVAL '30 days'`)
  ]);

  res.json({
   activeAlertCapWindows:caps.rows[0].count,
   calibrationBindingStates:bindings.rows[0].count,
   manifestReplayAudits30d:replays.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 140 API running"
));


module.exports = app;
