const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  validateTriage,
  nextAlertStatus
}=require("./triage");
const {
  scoreSession,
  suspiciousSession
}=require("./session");
const {
  DevelopmentEvidenceSigner,
  buildSignedEvidence
}=require("./signed-evidence");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"
    ?{rejectUnauthorized:true}
    :false
});

const signer=new DevelopmentEvidenceSigner({
  secret:process.env.DEV_EVIDENCE_SECRET||
    "development-evidence-secret"
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:98,
  service:"security-operations"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/alerts/:id/triage",
async(req,res)=>{
  const {
    analyst,
    decision,
    notes
  }=req.body||{};

  const validation=validateTriage({
    decision,
    notes
  });

  if(!analyst)
    return res.status(400).json({
      error:"analyst is required"
    });

  if(!validation.valid)
    return res.status(400).json(validation);

  try{
    const status=nextAlertStatus(
      decision
    );

    await pool.query(`
      INSERT INTO security_alert_triage
        (alert_id,analyst,
         decision,notes)
      VALUES($1,$2,$3,$4)
    `,[
      req.params.id,
      analyst,
      decision,
      notes
    ]);

    await pool.query(`
      UPDATE security_alerts
      SET status=$2
      WHERE id=$1
    `,[
      req.params.id,
      status
    ]);

    res.json({
      alertId:req.params.id,
      status,
      decision
    });
  }catch{
    res.status(500).json({
      error:"Could not triage alert"
    });
  }
});

app.post("/api/security/sessions",
async(req,res)=>{
  const {
    subject,
    sessionType="PRIVILEGED",
    sourceIp=null,
    resourceScope=null
  }=req.body||{};

  if(!subject)
    return res.status(400).json({
      error:"subject is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO privileged_sessions
        (subject,session_type,
         source_ip,resource_scope)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      subject,
      sessionType,
      sourceIp,
      resourceScope
    ]);

    res.status(201).json({
      session:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create privileged session"
    });
  }
});

app.post("/api/security/sessions/:id/events",
async(req,res)=>{
  const {
    eventType,
    resource=null,
    action=null,
    outcome=null,
    metadata={}
  }=req.body||{};

  if(!eventType)
    return res.status(400).json({
      error:"eventType is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO privileged_session_events
        (session_id,event_type,
         resource,action,outcome,metadata)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      req.params.id,
      eventType,
      resource,
      action,
      outcome,
      JSON.stringify(metadata)
    ]);

    res.status(201).json({
      event:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not record session event"
    });
  }
});

app.post("/api/security/sessions/:id/score",
async(req,res)=>{
  const signals=req.body||{};
  const result=scoreSession(signals);

  if(suspiciousSession(result.score)){
    try{
      await pool.query(`
        INSERT INTO security_alerts
          (alert_type,severity,
           subject,resource,action,
           score,reason,metadata)
        VALUES(
          'PRIVILEGED_SESSION_ANOMALY',
          $1,$2,$3,$4,$5,$6,$7
        )
      `,[
        result.severity,
        signals.subject||null,
        signals.resource||null,
        signals.action||null,
        result.score,
        "Suspicious privileged session activity",
        JSON.stringify(signals)
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/evidence/sign",
async(req,res)=>{
  const {
    evidenceType,
    data,
    createdBy
  }=req.body||{};

  if(!evidenceType||
     data===undefined||
     !createdBy)
    return res.status(400).json({
      error:"evidenceType, data and createdBy are required"
    });

  const evidence=buildSignedEvidence({
    evidenceType,
    data,
    createdBy,
    signer
  });

  try{
    await pool.query(`
      INSERT INTO signed_evidence_bundles
        (evidence_type,digest,
         signature,key_version,
         algorithm,created_by)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      evidence.evidenceType,
      evidence.digest,
      evidence.signature,
      evidence.keyVersion,
      evidence.algorithm,
      evidence.createdBy
    ]);
  }catch{}

  res.status(201).json({
    evidence
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
    valid:signer.verify(
      digest,
      signature
    )
  });
});

app.get("/api/security/operations-dashboard",
async(_req,res)=>{
  try{
    const [alerts,sessions,evidence,triage]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM security_alerts
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM privileged_sessions
        WHERE status='ACTIVE'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM signed_evidence_bundles
        WHERE created_at>NOW()-INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM security_alert_triage
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      openAlerts:alerts.rows[0].count,
      activePrivilegedSessions:sessions.rows[0].count,
      signedEvidence30d:evidence.rows[0].count,
      triageEvents24h:triage.rows[0].count,
      evidenceSigner:{
        mode:"SIMULATION",
        keyVersion:signer.keyVersion,
        algorithm:"HMAC-SHA256"
      }
    });
  }catch{
    res.status(500).json({
      error:"Could not load security operations dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 98 Security Operations API running"
));
