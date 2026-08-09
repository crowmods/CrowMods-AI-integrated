const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  evaluateWindows
}=require("./multi-window-burn");
const {
  decidePolicy
}=require("./budget-policy");
const {
  evaluateProvider
}=require("./failover");
const {
  calculateReliability
}=require("./reliability-report");

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
  phase:107
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/burn-rate/multi-window",
async(req,res)=>{
  const {
    sloId,
    targetPercent,
    observedSuccessPercent
  }=req.body||{};

  try{
    const windows=evaluateWindows({
      targetPercent:Number(targetPercent),
      observedSuccessPercent:
        Number(observedSuccessPercent)
    });

    if(sloId){
      for(const item of windows){
        await pool.query(`
          INSERT INTO burn_rate_windows
            (slo_id,window_minutes,
             observed_success_percent,
             burn_rate,severity,status)
          VALUES($1,$2,$3,$4,$5,$6)
        `,[
          sloId,
          item.windowMinutes,
          Number(observedSuccessPercent),
          item.burnRate,
          item.severity,
          item.status
        ]);
      }
    }

    res.json({
      windows,
      highestSeverity:
        windows.some(x=>x.severity==="CRITICAL")
          ?"CRITICAL"
          :windows.some(x=>x.severity==="HIGH")
            ?"HIGH"
            :windows.some(x=>x.severity==="MEDIUM")
              ?"MEDIUM"
              :"INFO"
    });
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.post("/api/security/budget-policy",
async(req,res)=>{
  const {
    sloId,
    budgetStatus,
    highestSeverity,
    changeInProgress=false
  }=req.body||{};

  const decision=decidePolicy({
    budgetStatus,
    highestSeverity,
    changeInProgress
  });

  if(sloId){
    try{
      await pool.query(`
        INSERT INTO budget_policy_actions
          (slo_id,policy,decision,reason)
        VALUES($1,$2,$3,$4)
      `,[
        sloId,
        "SECURITY_ERROR_BUDGET",
        decision.decision,
        decision.reason
      ]);
    }catch{}
  }

  res.json(decision);
});

app.post("/api/security/provider-failover/evaluate",
async(req,res)=>{
  const {
    providerType,
    primaryProvider,
    fallbackProvider,
    primaryHealthy,
    fallbackAvailable,
    securityCritical=true
  }=req.body||{};

  const result=evaluateProvider({
    primaryHealthy:Boolean(primaryHealthy),
    fallbackAvailable:Boolean(fallbackAvailable),
    securityCritical:Boolean(securityCritical)
  });

  try{
    await pool.query(`
      INSERT INTO provider_failover_events
        (provider_type,primary_provider,
         fallback_provider,state,reason)
      VALUES($1,$2,$3,$4,$5)
    `,[
      providerType||"security-provider",
      primaryProvider||"primary",
      fallbackProvider||null,
      result.state,
      result.allowSensitiveOperations
        ?"primary_healthy"
        :"security_boundary_preserved"
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/reliability-report",
async(req,res)=>{
  try{
    const result=calculateReliability({
      totalChecks:Number(req.body?.totalChecks),
      successfulChecks:
        Number(req.body?.successfulChecks),
      failedChecks:
        Number(req.body?.failedChecks),
      burnAlerts:
        Number(req.body?.burnAlerts)||0
    });

    try{
      await pool.query(`
        INSERT INTO reliability_reports
          (report_window_hours,
           total_checks,successful_checks,
           failed_checks,
           availability_percent,
           burn_alerts)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        Number(req.body?.windowHours)||24,
        result.totalChecks,
        result.successfulChecks,
        result.failedChecks,
        result.availabilityPercent,
        result.burnAlerts
      ]);
    }catch{}

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.get("/api/security/reliability-dashboard",
async(_req,res)=>{
  try{
    const [burn,failover,reports]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM burn_rate_windows
          WHERE status='ALERT'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM provider_failover_events
          WHERE state='FAIL_CLOSED'
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM reliability_reports
          WHERE generated_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      burnAlerts24h:burn.rows[0].count,
      failClosedEvents24h:
        failover.rows[0].count,
      reliabilityReports30d:
        reports.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load reliability dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 107 Reliability API running"
));
