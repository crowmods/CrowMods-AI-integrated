const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  enforceFencing,
  fencingMiddleware
}=require("./fencing-middleware");
const {
  evaluatePromotion,
  promoteCanary
}=require("./canary-promotion");
const {
  determineRevocation
}=require("./delegation-revocation");
const {
  forecastWithConfidence
}=require("./forecast-confidence");
const {
  buildBundle
}=require("./governance-bundle");
const {
  DecisionSigner
}=require("./decision-signer");

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

const signer=new DecisionSigner(
  process.env.GOVERNANCE_SIGNING_SECRET||
  "development-only"
);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:118
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/fencing/check",
async(req,res)=>{
  const result=enforceFencing({
    resourceKey:req.body?.resourceKey,
    presentedVersion:
      Number(req.body?.presentedVersion),
    currentVersion:
      Number(req.body?.currentVersion),
    tokenStatus:req.body?.tokenStatus,
    expiresAt:req.body?.expiresAt,
    now:req.body?.now||new Date()
  });

  try{
    await pool.query(`
      INSERT INTO fencing_enforcement_events
        (resource_key,presented_version,
         current_version,result,reason)
      VALUES($1,$2,$3,$4,$5)
    `,[
      req.body?.resourceKey||"unknown",
      Number(req.body?.presentedVersion)||null,
      Number(req.body?.currentVersion)||null,
      result.result,
      result.reason||null
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/canary/promotion",
async(req,res)=>{
  const eligibility=evaluatePromotion({
    checks:req.body?.checks||{}
  });

  const promotion=promoteCanary({
    eligibility,
    authorizedBy:req.body?.authorizedBy
  });

  try{
    await pool.query(`
      INSERT INTO canary_promotion_gates
        (dead_letter_id,replay_key,
         canary_id,required_checks,
         passed_checks,promotion_status)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(replay_key) DO NOTHING
    `,[
      req.body?.deadLetterId||null,
      req.body?.replayKey,
      req.body?.canaryId||null,
      eligibility.requiredChecks,
      eligibility.passedChecks,
      promotion.status==="PROMOTED"
        ?"PROMOTED"
        :eligibility.status
    ]);
  }catch{}

  res.json({
    eligibility,
    promotion
  });
});

app.post("/api/security/delegation/revocation-check",
async(req,res)=>{
  const result=determineRevocation({
    status:req.body?.status,
    endsAt:req.body?.endsAt,
    now:req.body?.now||new Date()
  });

  if(result.action==="EXECUTE"){
    try{
      await pool.query(`
        INSERT INTO delegation_revocation_jobs
          (delegation_id,reason,status,executed_at)
        VALUES($1,$2,'EXECUTED',NOW())
      `,[
        req.body?.delegationId||null,
        result.reason
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk/forecast-confidence",
async(req,res)=>{
  const result=forecastWithConfidence({
    currentScore:
      Number(req.body?.currentScore),
    slopePerPeriod:
      Number(req.body?.slopePerPeriod),
    horizonPeriods:
      Number(req.body?.horizonPeriods)||4,
    volatility:
      Number(req.body?.volatility)||5
  });

  try{
    await pool.query(`
      INSERT INTO risk_forecast_confidence
        (current_score,projected_score,
         lower_bound,upper_bound,
         confidence,horizon_periods)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      result.currentScore||0,
      result.projectedScore,
      result.lowerBound,
      result.upperBound,
      result.confidence||0,
      result.horizonPeriods||0
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/governance/bundle",
async(req,res)=>{
  try{
    const result=buildBundle({
      bundleId:req.body?.bundleId,
      manifest:req.body?.manifest||{},
      signer
    });

    try{
      await pool.query(`
        INSERT INTO signed_governance_bundles
          (bundle_id,digest,signature,
           key_version,algorithm,manifest)
        VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(bundle_id) DO NOTHING
      `,[
        result.bundleId,
        result.digest,
        result.signature,
        result.keyVersion,
        result.algorithm,
        JSON.stringify(result.manifest)
      ]);
    }catch{}

    res.json({
      ...result,
      signerMode:"DEVELOPMENT_ADAPTER"
    });
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post(
  "/api/security/protected-operation",
  fencingMiddleware(),
  (req,res)=>{
    res.json({
      status:"AUTHORIZED",
      fencing:req.fencing
    });
  }
);

app.get("/api/security/governance-enforcement-dashboard",
async(_req,res)=>{
  try{
    const [blocked,promoted,
           revoked,forecast,bundles]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM fencing_enforcement_events
          WHERE result='BLOCKED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM canary_promotion_gates
          WHERE promotion_status='PROMOTED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM delegation_revocation_jobs
          WHERE status='EXECUTED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT projected_score,
                 lower_bound,upper_bound,
                 confidence
          FROM risk_forecast_confidence
          ORDER BY created_at DESC
          LIMIT 1
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM signed_governance_bundles
          WHERE created_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      blockedFencingEvents30d:
        blocked.rows[0].count,
      promotedCanaries30d:
        promoted.rows[0].count,
      executedRevocations30d:
        revoked.rows[0].count,
      latestForecastConfidence:
        forecast.rows[0]||null,
      signedBundles30d:
        bundles.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load governance enforcement dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 118 Governance Enforcement API running"
));


module.exports = app;
