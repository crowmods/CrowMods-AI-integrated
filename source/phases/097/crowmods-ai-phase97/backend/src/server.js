const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  findStaleSubjects,
  buildAssignments
}=require("./access-review-generator");
const {
  scorePrivilegedAction,
  anomalyReason
}=require("./anomaly");
const {
  analyzePolicyConflicts
}=require("./conflicts");
const {
  buildEvidence
}=require("./evidence");

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

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:97,
  service:"security-detection"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/access-reviews/generate",
async(req,res)=>{
  const {
    subjects=[],
    lastSeenBySubject={},
    reviewer,
    dueAt,
    now=Date.now()
  }=req.body||{};

  if(!Array.isArray(subjects)||!reviewer)
    return res.status(400).json({
      error:"subjects and reviewer are required"
    });

  const stale=findStaleSubjects({
    subjects,
    lastSeenBySubject,
    now
  });

  const assignments=buildAssignments({
    subjects:stale,
    reviewer,
    dueAt
  });

  try{
    for(const assignment of assignments){
      await pool.query(`
        INSERT INTO access_review_assignments
          (campaign_id,subject,
           assigned_reviewer,due_at)
        VALUES(
          gen_random_uuid(),
          $1,$2,$3
        )
      `,[
        assignment.subject,
        assignment.assignedReviewer,
        assignment.dueAt||null
      ]);
    }
  }catch{}

  res.json({
    staleSubjects:stale,
    assignments
  });
});

app.post("/api/security/anomaly/score",
async(req,res)=>{
  const signals=req.body||{};

  const result=scorePrivilegedAction(
    signals
  );

  if(result.score>=50){
    try{
      await pool.query(`
        INSERT INTO security_alerts
          (alert_type,severity,
           subject,resource,action,
           score,reason,metadata)
        VALUES(
          'PRIVILEGED_ACTION_ANOMALY',
          $1,$2,$3,$4,$5,$6,$7
        )
      `,[
        result.severity,
        signals.subject||null,
        signals.resource||null,
        signals.action||null,
        result.score,
        anomalyReason({
          score:result.score,
          signals:signals.signalNames||[]
        }),
        JSON.stringify(signals)
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/policy-conflicts/analyze",
async(req,res)=>{
  const {
    policies=[]
  }=req.body||{};

  if(!Array.isArray(policies))
    return res.status(400).json({
      error:"policies must be an array"
    });

  const conflicts=analyzePolicyConflicts(
    policies
  );

  try{
    for(const conflict of conflicts){
      await pool.query(`
        INSERT INTO policy_conflicts
          (policy_a_id,policy_b_id,
           resource,action,
           conflict_type,severity,details)
        VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING
      `,[
        conflict.policyA,
        conflict.policyB,
        conflict.resource,
        conflict.action,
        conflict.conflictType,
        conflict.severity,
        JSON.stringify(conflict)
      ]);
    }
  }catch{}

  res.json({
    conflictCount:conflicts.length,
    conflicts
  });
});

app.post("/api/security/evidence/generate",
async(req,res)=>{
  const {
    evidenceType,
    generatedBy,
    data
  }=req.body||{};

  if(!evidenceType||!generatedBy||
     data===undefined)
    return res.status(400).json({
      error:"evidenceType, generatedBy and data are required"
    });

  const evidence=buildEvidence({
    evidenceType,
    generatedBy,
    data
  });

  try{
    await pool.query(`
      INSERT INTO governance_evidence
        (evidence_type,evidence_hash,
         generated_by,metadata)
      VALUES($1,$2,$3,$4)
    `,[
      evidence.evidenceType,
      evidence.evidenceHash,
      evidence.generatedBy,
      JSON.stringify(evidence.metadata)
    ]);
  }catch{}

  res.status(201).json({
    evidence
  });
});

app.get("/api/security/detection-dashboard",
async(_req,res)=>{
  try{
    const [alerts,conflicts,reviews,evidence]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM security_alerts
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM policy_conflicts
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM access_review_assignments
        WHERE status='PENDING'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM governance_evidence
        WHERE created_at>NOW()-INTERVAL '30 days'
      `)
    ]);

    res.json({
      openAlerts:alerts.rows[0].count,
      openPolicyConflicts:conflicts.rows[0].count,
      pendingReviewAssignments:reviews.rows[0].count,
      evidence30d:evidence.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load detection dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 97 Security Detection API running"
));
