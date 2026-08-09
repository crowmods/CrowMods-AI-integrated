const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  validateAdapterConfig
}=require("./kms-adapters");
const {
  acquireLease,
  leaseExpired
}=require("./worker-lease");
const {
  calculateRetry
}=require("./retry-policy");
const {
  requestAcceptance,
  evaluateAcceptance
}=require("./risk-acceptance");
const {
  forecastAssurance
}=require("./assurance-forecast");

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
  phase:114
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/kms/adapter",
async(req,res)=>{
  const result=validateAdapterConfig({
    provider:req.body?.provider,
    keyReference:req.body?.keyReference
  });

  if(result.status==="VALID"){
    try{
      await pool.query(`
        INSERT INTO kms_provider_adapters
          (provider_name,endpoint,key_reference)
        VALUES($1,$2,$3)
        ON CONFLICT(provider_name)
        DO UPDATE SET
          endpoint=EXCLUDED.endpoint,
          key_reference=EXCLUDED.key_reference
      `,[
        req.body.provider,
        req.body.endpoint||null,
        req.body.keyReference
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/control-job/lease",
(req,res)=>{
  res.json(acquireLease({
    job:req.body?.job,
    workerId:req.body?.workerId,
    now:req.body?.now||new Date(),
    leaseSeconds:
      Number(req.body?.leaseSeconds)||300
  }));
});

app.post("/api/security/control-job/lease-check",
(req,res)=>{
  res.json({
    expired:leaseExpired({
      leasedUntil:req.body?.leasedUntil,
      now:req.body?.now||new Date()
    })
  });
});

app.post("/api/security/control-job/retry",
async(req,res)=>{
  try{
    const result=calculateRetry({
      attempt:Number(req.body?.attempt),
      maxAttempts:
        Number(req.body?.maxAttempts)||5,
      baseDelaySeconds:
        Number(req.body?.baseDelaySeconds)||10,
      maxDelaySeconds:
        Number(req.body?.maxDelaySeconds)||900
    });

    if(result.retry&&req.body?.jobId){
      try{
        await pool.query(`
          INSERT INTO control_test_retries
            (job_id,attempt,
             delay_seconds,reason)
          VALUES($1,$2,$3,$4)
        `,[
          req.body.jobId,
          result.attempt,
          result.delaySeconds,
          req.body?.reason||
            "control_test_failure"
        ]);
      }catch{}
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post("/api/security/risk-acceptance/request",
async(req,res)=>{
  const result=requestAcceptance({
    riskStatement:req.body?.riskStatement,
    owner:req.body?.owner,
    expiresAt:req.body?.expiresAt
  });

  if(result.status==="REQUESTED"){
    try{
      await pool.query(`
        INSERT INTO risk_acceptances
          (control_id,risk_statement,
           owner,status,expires_at)
        VALUES($1,$2,$3,$4,$5)
      `,[
        req.body?.controlId||null,
        result.riskStatement,
        result.owner,
        result.status,
        result.expiresAt
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk-acceptance/evaluate",
(req,res)=>{
  res.json(evaluateAcceptance({
    status:req.body?.status,
    expiresAt:req.body?.expiresAt,
    now:req.body?.now||new Date()
  }));
});

app.post("/api/security/assurance/forecast",
async(req,res)=>{
  const result=forecastAssurance({
    currentScore:Number(req.body?.currentScore),
    slopePerPeriod:
      Number(req.body?.slopePerPeriod),
    horizonPeriods:
      Number(req.body?.horizonPeriods)||4
  });

  try{
    await pool.query(`
      INSERT INTO assurance_forecasts
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

app.get("/api/security/recovery-assurance-dashboard",
async(_req,res)=>{
  try{
    const [leases,retries,acceptances,forecasts]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM control_test_leases
          WHERE status='ACTIVE'
          AND leased_until>NOW()
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM control_test_retries
          WHERE created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM risk_acceptances
          WHERE status='APPROVED'
          AND (expires_at IS NULL OR expires_at>NOW())
        `),
        pool.query(`
          SELECT current_score,
                 projected_score,
                 forecast_status
          FROM assurance_forecasts
          ORDER BY created_at DESC
          LIMIT 1
        `)
      ]);

    res.json({
      activeWorkerLeases:
        leases.rows[0].count,
      retries24h:
        retries.rows[0].count,
      activeRiskAcceptances:
        acceptances.rows[0].count,
      latestForecast:
        forecasts.rows[0]||null
    });
  }catch{
    res.status(500).json({
      error:"Could not load recovery assurance dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 114 Recovery Assurance API running"
));
