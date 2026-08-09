const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  validateKmsResponse
}=require("./kms-verifier");
const {
  createIdempotencyKey,
  claimJob,
  completeJob
}=require("./scheduler");
const {
  calculatePriority
}=require("./risk-priority");
const {
  calculateAssurance
}=require("./assurance-score");

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
  phase:113
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/evidence/kms-verify",
async(req,res)=>{
  const result=validateKmsResponse({
    verified:Boolean(req.body?.verified),
    provider:req.body?.provider,
    keyReference:req.body?.keyReference
  });

  try{
    await pool.query(`
      INSERT INTO kms_verification_events
        (provider,key_reference,digest,
         signature,verification_status)
      VALUES($1,$2,$3,$4,$5)
    `,[
      req.body?.provider||"unknown",
      req.body?.keyReference||"unknown",
      req.body?.digest||"",
      req.body?.signature||"",
      result.status
    ]);
  }catch{}

  res.json({
    ...result,
    adapterMode:"PRODUCTION_ADAPTER_BOUNDARY"
  });
});

app.post("/api/security/control-job/schedule",
async(req,res)=>{
  const idempotencyKey=createIdempotencyKey({
    controlId:req.body?.controlId,
    scheduledFor:req.body?.scheduledFor
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO control_test_jobs
        (control_id,idempotency_key,
         scheduled_for,status)
      VALUES($1,$2,$3,'SCHEDULED')
      ON CONFLICT(idempotency_key)
      DO NOTHING
      RETURNING *
    `,[
      req.body?.controlId,
      idempotencyKey,
      req.body?.scheduledFor
    ]);

    res.status(201).json({
      created:rows.length===1,
      idempotencyKey,
      job:rows[0]||null
    });
  }catch{
    res.status(400).json({
      error:"Could not schedule control test"
    });
  }
});

app.post("/api/security/control-job/claim",
(req,res)=>{
  res.json(
    claimJob(req.body?.job)
  );
});

app.post("/api/security/control-job/complete",
(req,res)=>{
  res.json(
    completeJob({
      success:Boolean(req.body?.success),
      error:req.body?.error
    })
  );
});

app.post("/api/security/control/risk-priority",
async(req,res)=>{
  try{
    const result=calculatePriority(
      req.body||{}
    );

    if(req.body?.controlId){
      await pool.query(`
        INSERT INTO control_risk_priorities
          (control_id,likelihood,impact,
           exposure,effectiveness,
           priority_score,priority)
        VALUES($1,$2,$3,$4,$5,$6,$7)
      `,[
        req.body.controlId,
        result.likelihood,
        result.impact,
        result.exposure,
        result.effectiveness,
        result.priorityScore,
        result.priority
      ]);
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post("/api/security/assurance/score",
async(req,res)=>{
  const result=calculateAssurance(
    req.body||{}
  );

  if(result.score!==null){
    try{
      await pool.query(`
        INSERT INTO assurance_scores
          (score,evidence_score,
           control_score,governance_score,
           reliability_score,risk_score,status)
        VALUES($1,$2,$3,$4,$5,$6,$7)
      `,[
        result.score,
        result.evidenceScore,
        result.controlScore,
        result.governanceScore,
        result.reliabilityScore,
        result.riskScore,
        result.status
      ]);
    }catch{}
  }

  res.json(result);
});

app.get("/api/security/assurance-dashboard",
async(_req,res)=>{
  try{
    const [kms,jobs,critical,latest]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM kms_verification_events
          WHERE verification_status='VERIFIED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM control_test_jobs
          WHERE status IN ('SCHEDULED','RUNNING')
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM control_risk_priorities
          WHERE priority='CRITICAL'
        `),
        pool.query(`
          SELECT score,status
          FROM assurance_scores
          ORDER BY created_at DESC
          LIMIT 1
        `)
      ]);

    res.json({
      verifiedKmsEvents30d:
        kms.rows[0].count,
      activeControlJobs:
        jobs.rows[0].count,
      criticalControlPriorities:
        critical.rows[0].count,
      latestAssuranceScore:
        latest.rows[0]||null
    });
  }catch{
    res.status(500).json({
      error:"Could not load assurance dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 113 Assurance API running"
));
