const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  validateSourcePolicy
}=require("./source-auth");
const {
  createSignedBundle,
  DevelopmentBundleSigner
}=require("./report-bundle");
const {
  createEscalation
}=require("./action-escalation");
const {
  evaluateControl
}=require("./control-effectiveness");

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

const signer=new DevelopmentBundleSigner(
  process.env.DEV_BUNDLE_SIGNING_SECRET||
  "development-only"
);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:111
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/source/authorize",
async(req,res)=>{
  const result=validateSourcePolicy(
    req.body||{}
  );

  try{
    await pool.query(`
      INSERT INTO ingestion_sources
        (source_name,source_type,
         auth_mode,expected_audience)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(source_name)
      DO UPDATE SET
        auth_mode=EXCLUDED.auth_mode,
        expected_audience=EXCLUDED.expected_audience
    `,[
      req.body?.sourceName||"unknown",
      req.body?.sourceType||"security",
      req.body?.authMode||"BLOCKED",
      req.body?.expectedAudience||null
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/report/bundle",
async(req,res)=>{
  const result=createSignedBundle({
    reportType:req.body?.reportType||
      "SECURITY_REPORT",
    version:Number(req.body?.version)||1,
    report:req.body?.report||{},
    evidence:req.body?.evidence||[],
    signer
  });

  try{
    await pool.query(`
      INSERT INTO signed_report_bundles
        (report_type,report_version,
         digest,signature,key_version,
         algorithm,bundle)
      VALUES($1,$2,$3,$4,$5,$6,$7)
    `,[
      req.body?.reportType||"SECURITY_REPORT",
      Number(req.body?.version)||1,
      result.digest,
      result.signature,
      result.keyVersion,
      result.algorithm,
      JSON.stringify(result.bundle)
    ]);
  }catch{}

  res.json({
    ...result,
    signerMode:"DEVELOPMENT_ADAPTER"
  });
});

app.post("/api/security/action/escalate",
async(req,res)=>{
  const result=createEscalation(
    req.body||{}
  );

  if(req.body?.actionId&&result.level>0){
    try{
      await pool.query(`
        INSERT INTO action_escalations
          (action_id,escalation_level,
           reason,target)
        VALUES($1,$2,$3,$4)
      `,[
        req.body.actionId,
        result.level,
        result.reason,
        result.target
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/control/evaluate",
async(req,res)=>{
  try{
    const result=evaluateControl({
      totalTests:Number(req.body?.totalTests),
      passedTests:Number(req.body?.passedTests),
      targetPercent:
        Number(req.body?.targetPercent)
    });

    if(req.body?.controlId){
      await pool.query(`
        INSERT INTO control_effectiveness_tests
          (control_id,total_tests,
           passed_tests,effectiveness_percent,
           status,evidence_ref)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        req.body.controlId,
        Number(req.body.totalTests),
        Number(req.body.passedTests),
        result.effectivenessPercent||0,
        result.status,
        req.body?.evidenceRef||null
      ]);
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.get("/api/security/control-dashboard",
async(_req,res)=>{
  try{
    const [bundles,escalations,effectiveness]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM signed_report_bundles
          WHERE created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM action_escalations
          WHERE status='OPEN'
        `),
        pool.query(`
          SELECT AVG(effectiveness_percent)
            ::numeric(7,3) AS avg
          FROM control_effectiveness_tests
          WHERE tested_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      signedReportBundles30d:
        bundles.rows[0].count,
      openEscalations:
        escalations.rows[0].count,
      averageControlEffectiveness:
        effectiveness.rows[0].avg
    });
  }catch{
    res.status(500).json({
      error:"Could not load control dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 111 Control API running"
));
