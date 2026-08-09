const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  normalizeEvent,
  DevelopmentSiemAdapter
}=require("./siem");
const {
  buildEscalation
}=require("./escalation");
const {
  validateSessionResponse
}=require("./session-response");
const {
  DevelopmentEvidenceExportSigner,
  createBundle
}=require("./evidence-export");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"8mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"
    ?{rejectUnauthorized:true}
    :false
});

const siem=new DevelopmentSiemAdapter();

const evidenceSigner=
  new DevelopmentEvidenceExportSigner({
    secret:
      process.env.DEV_EVIDENCE_EXPORT_SECRET||
      "development-export-secret"
  });

app.use((req,res,next)=>{
  req.correlationId=
    req.header("x-correlation-id")||
    crypto.randomUUID();

  res.setHeader(
    "x-correlation-id",
    req.correlationId
  );

  next();
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:99,
  service:"final-security-hardening"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({
      ready:true,
      siemAdapter:"SIMULATION",
      evidenceSigner:"SIMULATION"
    });
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/siem/events",
async(req,res)=>{
  try{
    const event=normalizeEvent({
      ...req.body,
      correlationId:
        req.body?.correlationId||
        req.correlationId
    });

    const delivery=await siem.send(event);

    try{
      await pool.query(`
        INSERT INTO siem_events
          (event_type,severity,
           subject,resource,action,
           source,correlation_id,payload)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      `,[
        event.eventType,
        event.severity,
        event.subject,
        event.resource,
        event.action,
        event.source,
        event.correlationId,
        JSON.stringify(event.payload)
      ]);
    }catch{}

    res.status(201).json({
      event,
      delivery
    });
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post("/api/security/alerts/:id/escalate",
async(req,res)=>{
  const {
    severity,
    reason,
    destination
  }=req.body||{};

  if(!severity||!reason)
    return res.status(400).json({
      error:"severity and reason are required"
    });

  const escalation=buildEscalation({
    alertId:req.params.id,
    severity,
    reason,
    destination
  });

  if(!escalation.required)
    return res.json({
      escalation,
      queued:false
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO security_escalations
        (alert_id,escalation_level,
         destination,reason,status)
      VALUES($1,$2,$3,$4,'SENT')
      RETURNING *
    `,[
      req.params.id,
      escalation.escalationLevel,
      escalation.destination,
      escalation.reason
    ]);

    res.status(201).json({
      escalation,
      record:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create escalation"
    });
  }
});

app.post("/api/security/sessions/:id/respond",
async(req,res)=>{
  const {
    action,
    requestedBy,
    reason
  }=req.body||{};

  const validation=validateSessionResponse({
    action,
    reason
  });

  if(!requestedBy)
    return res.status(400).json({
      error:"requestedBy is required"
    });

  if(!validation.valid)
    return res.status(400).json(validation);

  try{
    const {rows}=await pool.query(`
      INSERT INTO privileged_session_actions
        (session_id,action,
         requested_by,reason)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      req.params.id,
      action,
      requestedBy,
      reason
    ]);

    const nextStatus=
      action==="END"
        ?"ENDED"
        :"SUSPENDED";

    await pool.query(`
      UPDATE privileged_sessions
      SET status=$2,
          ended_at=CASE
            WHEN $2='ENDED' THEN NOW()
            ELSE ended_at
          END
      WHERE id=$1
    `,[
      req.params.id,
      nextStatus
    ]);

    res.status(201).json({
      action:rows[0],
      sessionStatus:nextStatus
    });
  }catch{
    res.status(500).json({
      error:"Could not apply session response"
    });
  }
});

app.post("/api/security/evidence/export",
async(req,res)=>{
  const {
    bundleType="SECURITY_EVIDENCE",
    records=[],
    createdBy
  }=req.body||{};

  if(!createdBy||!Array.isArray(records))
    return res.status(400).json({
      error:"createdBy and records are required"
    });

  const bundle=createBundle({
    bundleType,
    records,
    createdBy,
    signer:evidenceSigner
  });

  try{
    await pool.query(`
      INSERT INTO evidence_export_bundles
        (bundle_type,digest,
         signature,key_version,
         algorithm,record_count,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7)
    `,[
      bundle.bundleType,
      bundle.digest,
      bundle.signature,
      bundle.keyVersion,
      bundle.algorithm,
      bundle.recordCount,
      bundle.createdBy
    ]);
  }catch{}

  res.status(201).json({
    bundle,
    signerMode:"SIMULATION"
  });
});

app.post("/api/security/evidence/verify",
async(req,res)=>{
  const {
    digest,
    signature
  }=req.body||{};

  if(!digest||!signature)
    return res.status(400).json({
      error:"digest and signature are required"
    });

  res.json({
    valid:evidenceSigner.verify(
      digest,
      signature
    ),
    keyVersion:evidenceSigner.keyVersion,
    algorithm:evidenceSigner.algorithm
  });
});

app.get("/api/security/final-status",
async(_req,res)=>{
  try{
    const [alerts,escalations,sessions,exports]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_alerts
          WHERE status='OPEN'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_escalations
          WHERE status='SENT'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM privileged_sessions
          WHERE status='ACTIVE'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM evidence_export_bundles
          WHERE created_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      phase:99,
      openAlerts:alerts.rows[0].count,
      sentEscalations:escalations.rows[0].count,
      activePrivilegedSessions:sessions.rows[0].count,
      evidenceExports30d:exports.rows[0].count,
      siem:{
        mode:"SIMULATION",
        bufferedEvents:siem.events.length
      },
      evidence:{
        mode:"SIMULATION",
        keyVersion:evidenceSigner.keyVersion,
        algorithm:evidenceSigner.algorithm
      }
    });
  }catch{
    res.status(500).json({
      error:"Could not load final security status"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 99 Final Security API running"
));


module.exports = app;
