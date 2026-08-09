const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  calculateBudget,
  evaluateBurn
}=require("./error-budget");
const {
  WorkloadIdentityProvider
}=require("./workload-provider");
const {
  validateTlsConnectorConfig
}=require("./tls-connector");
const {
  ProductionKmsAdapter
}=require("./kms-adapter");

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

const identityProvider=
  new WorkloadIdentityProvider({
    name:process.env.WORKLOAD_IDENTITY_PROVIDER,
    issuer:process.env.WORKLOAD_IDENTITY_ISSUER,
    audience:process.env.SIEM_AUDIENCE
  });

const tlsConfig=validateTlsConnectorConfig({
  allowlist:
    process.env.TLS_TARGET_ALLOWLIST
      ?process.env.TLS_TARGET_ALLOWLIST
        .split(",")
        .map(x=>x.trim())
        .filter(Boolean)
      :[]
});

const kms=new ProductionKmsAdapter({
  provider:process.env.KMS_PROVIDER,
  keyId:process.env.KMS_KEY_ID,
  algorithm:process.env.KMS_ALGORITHM
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:106
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/security/provider-status",
(_req,res)=>{
  res.json({
    workloadIdentity:
      identityProvider.configurationStatus(),
    tls:tlsConfig,
    kms:kms.configurationStatus()
  });
});

app.post("/api/security/error-budget/evaluate",
async(req,res)=>{
  const {
    sloId,
    targetPercent,
    total,
    failures
  }=req.body||{};

  try{
    const result=calculateBudget({
      targetPercent:Number(targetPercent),
      total:Number(total),
      failures:Number(failures)
    });

    if(sloId){
      await pool.query(`
        INSERT INTO security_error_budgets
          (slo_id,window_hours,
           target_percent,
           allowed_failure_percent,
           consumed_failure_percent,
           remaining_budget_percent,
           status)
        VALUES($1,$2,$3,$4,$5,$6,$7)
      `,[
        sloId,
        Number(req.body.windowHours)||1,
        Number(targetPercent),
        result.allowedFailurePercent,
        result.consumedFailurePercent||0,
        result.remainingBudgetPercent||0,
        result.status
      ]);
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post("/api/security/burn-rate/evaluate",
async(req,res)=>{
  const {
    sloId,
    targetPercent,
    observedSuccessPercent,
    windowMinutes
  }=req.body||{};

  try{
    const result=evaluateBurn({
      targetPercent:Number(targetPercent),
      observedSuccessPercent:
        Number(observedSuccessPercent),
      windowMinutes:Number(windowMinutes)
    });

    if(sloId){
      await pool.query(`
        INSERT INTO security_burn_rates
          (slo_id,window_minutes,
           burn_rate,severity,status)
        VALUES($1,$2,$3,$4,$5)
      `,[
        sloId,
        Number(windowMinutes),
        result.burnRate,
        result.severity,
        result.status
      ]);
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.get("/api/security/error-budget-dashboard",
async(_req,res)=>{
  try{
    const [healthy,warning,exhausted,alerts]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_error_budgets
          WHERE status='HEALTHY'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_error_budgets
          WHERE status='WARNING'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_error_budgets
          WHERE status='EXHAUSTED'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_burn_rates
          WHERE status='ALERT'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `)
      ]);

    res.json({
      healthyBudgets24h:healthy.rows[0].count,
      warningBudgets24h:warning.rows[0].count,
      exhaustedBudgets24h:exhausted.rows[0].count,
      burnAlerts24h:alerts.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load error-budget dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 106 Error Budget API running"
));
