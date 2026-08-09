const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  buildTimeline
}=require("./timeline");
const {
  correlateDeployment
}=require("./deployment-correlation");
const {
  DevelopmentRecoverySigner,
  signEvidence
}=require("./recovery-evidence");
const {
  validateReview,
  canCloseReview
}=require("./post-incident");

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

const signer=new DevelopmentRecoverySigner(
  process.env.DEV_RECOVERY_SIGNING_SECRET||
  "development-only"
);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:109
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/incident/timeline",
async(req,res)=>{
  const timeline=buildTimeline(
    req.body?.events||[]
  );

  if(req.body?.incidentId){
    for(const event of timeline){
      try{
        await pool.query(`
          INSERT INTO incident_timeline_events
            (incident_id,event_type,
             event_time,source,
             reference_key,summary,metadata)
          VALUES($1,$2,$3,$4,$5,$6,$7)
        `,[
          req.body.incidentId,
          event.eventType,
          event.timestamp,
          event.source||"unknown",
          event.referenceKey||null,
          event.summary||"Incident event",
          JSON.stringify(event.metadata||{})
        ]);
      }catch{}
    }
  }

  res.json({
    count:timeline.length,
    timeline
  });
});

app.post("/api/security/deployment/correlate",
async(req,res)=>{
  const result=correlateDeployment(
    req.body||{}
  );

  res.json(result);
});

app.post("/api/security/recovery/evidence",
async(req,res)=>{
  const evidence=req.body?.evidence;

  if(!evidence)
    return res.status(400).json({
      error:"evidence is required"
    });

  const signed=signEvidence({
    evidence,
    signer
  });

  if(req.body?.workflowId){
    try{
      await pool.query(`
        INSERT INTO recovery_evidence
          (workflow_id,digest,signature,
           key_version,algorithm,evidence)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        req.body.workflowId,
        signed.digest,
        signed.signature,
        signed.keyVersion,
        signed.algorithm,
        JSON.stringify(evidence)
      ]);
    }catch{}
  }

  res.json({
    ...signed,
    signerMode:"DEVELOPMENT_ADAPTER"
  });
});

app.post("/api/security/post-incident/review",
async(req,res)=>{
  const validation=validateReview({
    summary:req.body?.summary,
    rootCause:req.body?.rootCause
  });

  if(!validation.valid)
    return res.status(400).json(
      validation
    );

  try{
    const {rows}=await pool.query(`
      INSERT INTO post_incident_reviews
        (incident_id,status,summary,root_cause)
      VALUES($1,'DRAFT',$2,$3)
      RETURNING *
    `,[
      req.body?.incidentId||null,
      req.body.summary,
      req.body.rootCause||null
    ]);

    res.status(201).json({
      review:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create review"
    });
  }
});

app.post("/api/security/post-incident/close",
async(req,res)=>{
  const canClose=canCloseReview({
    status:req.body?.status,
    unresolvedCriticalActions:
      Number(
        req.body?.unresolvedCriticalActions
      )||0
  });

  if(!canClose)
    return res.status(409).json({
      closed:false,
      reason:"review_not_ready_to_close"
    });

  res.json({
    closed:true,
    status:"CLOSED"
  });
});

app.get("/api/security/incident-review-dashboard",
async(_req,res)=>{
  try{
    const [timeline,evidence,reviews]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM incident_timeline_events
          WHERE created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM recovery_evidence
          WHERE created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM post_incident_reviews
          WHERE status IN ('DRAFT','IN_REVIEW')
        `)
      ]);

    res.json({
      timelineEvents24h:
        timeline.rows[0].count,
      signedRecoveryEvidence24h:
        evidence.rows[0].count,
      openReviews:
        reviews.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load incident review dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 109 Incident Review API running"
));
