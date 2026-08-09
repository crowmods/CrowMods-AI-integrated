const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  forecastExhaustion
}=require("./forecast");
const {
  correlateChange
}=require("./correlation");
const {
  correlateSignals
}=require("./incident-correlation");
const {
  startRecovery,
  validationResult,
  verificationResult
}=require("./recovery-orchestrator");

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
  phase:108
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/budget-forecast",
async(req,res)=>{
  try{
    const result=forecastExhaustion({
      remainingBudgetPercent:
        Number(req.body?.remainingBudgetPercent),
      consumptionRatePercentPerHour:
        Number(req.body?.consumptionRatePercentPerHour),
      horizonHours:
        Number(req.body?.horizonHours)||24
    });

    if(req.body?.sloId){
      await pool.query(`
        INSERT INTO budget_forecasts
          (slo_id,current_remaining_percent,
           consumption_rate_percent_per_hour,
           hours_to_exhaustion,forecast_status)
        VALUES($1,$2,$3,$4,$5)
      `,[
        req.body.sloId,
        Number(req.body.remainingBudgetPercent),
        Number(req.body.consumptionRatePercentPerHour),
        result.hoursToExhaustion,
        result.forecastStatus
      ]);
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post("/api/security/correlate-change",
async(req,res)=>{
  const result=correlateChange({
    incidentStart:req.body?.incidentStart,
    incidentEnd:req.body?.incidentEnd,
    changeStart:req.body?.changeStart,
    changeEnd:req.body?.changeEnd,
    changeKey:req.body?.changeKey
  });

  if(req.body?.incidentId){
    try{
      await pool.query(`
        INSERT INTO reliability_correlations
          (incident_id,correlation_type,
           reference_key,confidence,reason)
        VALUES($1,$2,$3,$4,$5)
      `,[
        req.body.incidentId,
        result.correlationType,
        result.referenceKey,
        result.confidence,
        result.reason
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/correlate-incident",
(req,res)=>{
  res.json(correlateSignals({
    incidentSeverity:req.body?.incidentSeverity,
    burnAlert:Boolean(req.body?.burnAlert),
    providerFailure:Boolean(
      req.body?.providerFailure
    ),
    changeOverlap:
      Number(req.body?.changeOverlap)||0
  }));
});

app.post("/api/security/recovery/start",
async(req,res)=>{
  const result=startRecovery({
    securityCritical:
      req.body?.securityCritical!==false
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO recovery_workflows
        (provider_type,provider_name,state,
         requested_by)
      VALUES($1,$2,$3,$4)
      RETURNING id
    `,[
      req.body?.providerType||
        "security-provider",
      req.body?.providerName||
        "primary",
      result.state,
      req.body?.requestedBy||null
    ]);

    res.json({
      workflowId:rows[0].id,
      ...result
    });
  }catch{
    res.json(result);
  }
});

app.post("/api/security/recovery/validate",
(req,res)=>{
  res.json(validationResult({
    healthy:Boolean(req.body?.healthy),
    approved:Boolean(req.body?.approved),
    securityCritical:
      req.body?.securityCritical!==false
  }));
});

app.post("/api/security/recovery/verify",
(req,res)=>{
  res.json(verificationResult({
    healthy:Boolean(req.body?.healthy),
    securityChecksPassed:
      Boolean(req.body?.securityChecksPassed)
  }));
});

app.get("/api/security/orchestration-dashboard",
async(_req,res)=>{
  try{
    const [forecasts,correlations,recoveries]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM budget_forecasts
          WHERE forecast_status='EXHAUSTION_FORECAST'
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM reliability_correlations
          WHERE confidence>=0.75
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM recovery_workflows
          WHERE state IN ('RECOVERING','VERIFYING')
        `)
      ]);

    res.json({
      exhaustionForecasts24h:
        forecasts.rows[0].count,
      highConfidenceCorrelations24h:
        correlations.rows[0].count,
      activeRecoveries:
        recoveries.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load orchestration dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 108 Orchestration API running"
));
