const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  verifyDigestSignature,
  DevelopmentEvidenceVerifier
}=require("./evidence-verification");
const {
  nextRun,
  validateSchedule
}=require("./control-scheduler");
const {
  calculateTrend
}=require("./control-trends");
const {
  coverage,
  validateMapping
}=require("./governance");

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

const verifier=new DevelopmentEvidenceVerifier(
  process.env.DEV_EVIDENCE_VERIFY_SECRET||
  "development-only"
);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:112
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/evidence/verify",
async(req,res)=>{
  const result=verifyDigestSignature({
    digest:req.body?.digest,
    signature:req.body?.signature,
    verifier
  });

  try{
    await pool.query(`
      INSERT INTO evidence_verification_events
        (evidence_type,evidence_ref,
         digest,signature,
         verification_status,
         verifier_key_version)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      req.body?.evidenceType||"security-evidence",
      req.body?.evidenceRef||"unknown",
      req.body?.digest||"",
      req.body?.signature||"",
      result.status,
      verifier.keyVersion
    ]);
  }catch{}

  res.json({
    ...result,
    verifierMode:"DEVELOPMENT_ADAPTER"
  });
});

app.post("/api/security/control/schedule",
async(req,res)=>{
  const validation=validateSchedule({
    frequency:req.body?.frequency,
    owner:req.body?.owner
  });

  if(validation.status!=="VALID")
    return res.status(400).json(validation);

  const next=nextRun(
    req.body.frequency,
    req.body.from||new Date()
  );

  try{
    await pool.query(`
      INSERT INTO control_test_schedules
        (control_id,frequency,
         next_run_at,owner)
      VALUES($1,$2,$3,$4)
    `,[
      req.body?.controlId||null,
      req.body.frequency,
      next,
      req.body.owner
    ]);
  }catch{}

  res.json({
    ...validation,
    nextRunAt:next
  });
});

app.post("/api/security/control/trend",
async(req,res)=>{
  const result=calculateTrend(
    req.body?.values||[]
  );

  if(req.body?.controlId){
    try{
      await pool.query(`
        INSERT INTO control_effectiveness_trends
          (control_id,measured_at,
           effectiveness_percent,trend)
        VALUES($1,NOW(),$2,$3)
      `,[
        req.body.controlId,
        Number(
          (req.body.values||[]).at(-1)
        )||0,
        result.trend
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/governance/validate",
(req,res)=>{
  res.json(validateMapping(
    req.body||{}
  ));
});

app.post("/api/security/governance/coverage",
(req,res)=>{
  res.json(
    coverage(
      req.body?.statuses||[]
    )
  );
});

app.get("/api/security/governance-dashboard",
async(_req,res)=>{
  try{
    const [verified,mapped,trends]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM evidence_verification_events
          WHERE verification_status='VERIFIED'
          AND verified_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM governance_mappings
          WHERE mapping_status='MAPPED'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM control_effectiveness_trends
          WHERE trend='DECLINING'
          AND measured_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      verifiedEvidence30d:
        verified.rows[0].count,
      mappedGovernanceControls:
        mapped.rows[0].count,
      decliningControls30d:
        trends.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load governance dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 112 Governance API running"
));
