const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  issueFencingToken,
  validateFencingToken
}=require("./fencing");
const {
  validateCanary
}=require("./canary-replay");
const {
  evaluateDelegation
}=require("./delegation-lifecycle");
const {
  forecastRisk
}=require("./risk-forecast");
const {
  signDecisionEvidence,
  DevelopmentDecisionSigner
}=require("./signed-decision");

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

const signer=new DevelopmentDecisionSigner(
  process.env.DEV_DECISION_SIGNING_SECRET||
  "development-only"
);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:117
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/fencing/issue",
async(req,res)=>{
  const result=issueFencingToken({
    resourceKey:req.body?.resourceKey,
    ownerId:req.body?.ownerId,
    version:Number(req.body?.version),
    now:req.body?.now||new Date(),
    leaseSeconds:
      Number(req.body?.leaseSeconds)||300
  });

  if(result.status==="ISSUED"){
    try{
      await pool.query(`
        INSERT INTO lock_fencing_tokens
          (resource_key,owner_id,
           token_version,token,
           issued_at,expires_at,status)
        VALUES($1,$2,$3,$4,$5,$6,'ACTIVE')
      `,[
        result.resourceKey,
        result.ownerId,
        result.version,
        result.token,
        result.issuedAt,
        result.expiresAt
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/fencing/validate",
(req,res)=>{
  res.json(validateFencingToken({
    presentedVersion:
      Number(req.body?.presentedVersion),
    currentVersion:
      Number(req.body?.currentVersion),
    tokenStatus:req.body?.tokenStatus,
    expiresAt:req.body?.expiresAt,
    now:req.body?.now||new Date()
  }));
});

app.post("/api/security/dlq/canary",
async(req,res)=>{
  const result=validateCanary({
    deadLetter:req.body?.deadLetter,
    replayKey:req.body?.replayKey,
    canaryPercent:
      Number(req.body?.canaryPercent)||1,
    checks:req.body?.checks||{}
  });

  if(result.status==="PASSED"||
     result.status==="FAILED"){
    try{
      await pool.query(`
        INSERT INTO dlq_canary_replays
          (dead_letter_id,replay_key,
           canary_percent,canary_status,
           validation_summary)
        VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(replay_key) DO NOTHING
      `,[
        req.body?.deadLetter?.id||null,
        result.replayKey,
        result.canaryPercent,
        result.status,
        JSON.stringify(result.checks)
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/delegation/evaluate",
async(req,res)=>{
  const result=evaluateDelegation({
    status:req.body?.status,
    startsAt:req.body?.startsAt,
    endsAt:req.body?.endsAt,
    now:req.body?.now||new Date()
  });

  if(result.status==="EXPIRED"||
     result.status==="ACTIVE"){
    try{
      await pool.query(`
        INSERT INTO delegation_lifecycle_events
          (delegation_id,event_type,actor)
        VALUES($1,$2,$3)
      `,[
        req.body?.delegationId||null,
        result.status==="EXPIRED"
          ?"EXPIRED"
          :"ACTIVATED",
        req.body?.actor||"system"
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk/forecast",
async(req,res)=>{
  const result=forecastRisk({
    currentScore:
      Number(req.body?.currentScore),
    slopePerPeriod:
      Number(req.body?.slopePerPeriod),
    horizonPeriods:
      Number(req.body?.horizonPeriods)||4
  });

  try{
    await pool.query(`
      INSERT INTO risk_forecasts
        (current_score,slope_per_period,
         horizon_periods,projected_score,
         forecast_status)
      VALUES($1,$2,$3,$4,$5)
    `,[
      result.currentScore||0,
      result.slopePerPeriod||0,
      result.horizonPeriods||0,
      result.projectedScore,
      result.status
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/executive/decision/sign",
async(req,res)=>{
  const result=signDecisionEvidence({
    decision:req.body?.decision||{},
    evidence:req.body?.evidence||[],
    signer
  });

  if(req.body?.decisionId){
    try{
      await pool.query(`
        INSERT INTO signed_decision_evidence
          (decision_id,digest,signature,
           key_version,algorithm,evidence)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        req.body.decisionId,
        result.digest,
        result.signature,
        result.keyVersion,
        result.algorithm,
        JSON.stringify(result.evidence)
      ]);
    }catch{}
  }

  res.json({
    ...result,
    signerMode:"DEVELOPMENT_ADAPTER"
  });
});

app.get("/api/security/governance-recovery-dashboard",
async(_req,res)=>{
  try{
    const [fencing,canary,
           expired,forecasts,decisions]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM lock_fencing_tokens
          WHERE status='ACTIVE'
          AND expires_at>NOW()
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM dlq_canary_replays
          WHERE canary_status='PASSED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM delegation_lifecycle_events
          WHERE event_type='EXPIRED'
          AND created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT current_score,
                 projected_score,
                 forecast_status
          FROM risk_forecasts
          ORDER BY created_at DESC
          LIMIT 1
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM signed_decision_evidence
          WHERE created_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      activeFencingTokens:
        fencing.rows[0].count,
      successfulCanaryReplays30d:
        canary.rows[0].count,
      expiredDelegations30d:
        expired.rows[0].count,
      latestRiskForecast:
        forecasts.rows[0]||null,
      signedDecisionEvidence30d:
        decisions.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load governance recovery dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 117 Governance Recovery API running"
));


module.exports = app;
