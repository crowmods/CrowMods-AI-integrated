const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  breakerState,
  recordBreakerResult
}=require("./retry-circuit");
const {
  canaryRecoveryController
}=require("./canary-controller");
const {
  verifyTakeoverResult
}=require("./verified-takeover");
const {
  jointCalibration
}=require("./joint-calibration");
const {
  buildAuditEvent
}=require("./alert-audit");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"
    ?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>
  res.json({status:"healthy",phase:126})
);

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/retry/circuit",async(req,res)=>{
  const r=recordBreakerResult({
    state:req.body?.state||"CLOSED",
    success:Boolean(req.body?.success),
    failureCount:Number(req.body?.failureCount)||0,
    successCount:Number(req.body?.successCount)||0,
    failureThreshold:Number(
      req.body?.failureThreshold
    )||3,
    recoverySuccesses:Number(
      req.body?.recoverySuccesses
    )||2,
    now:req.body?.now||new Date()
  });

  try{
    await pool.query(`INSERT INTO circuit_breakers
      (breaker_key,state,failure_count,success_count,
       opened_at)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(breaker_key)
      DO UPDATE SET state=EXCLUDED.state,
        failure_count=EXCLUDED.failure_count,
        success_count=EXCLUDED.success_count,
        opened_at=EXCLUDED.opened_at,
        updated_at=NOW()`,[
      req.body?.breakerKey||"default",
      r.state,
      r.failureCount,
      r.successCount,
      r.openedAt||null
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/canary/recovery-controller",
async(req,res)=>{
  const r=canaryRecoveryController({
    state:req.body?.state||"ROLLBACK",
    currentStage:Number(req.body?.currentStage)||0,
    healthScore:Number(req.body?.healthScore),
    consecutiveSuccesses:Number(
      req.body?.consecutiveSuccesses
    )||0,
    requiredSuccesses:Number(
      req.body?.requiredSuccesses
    )||3
  });

  try{
    await pool.query(`INSERT INTO canary_recovery_controller
      (rollout_key,state,traffic_percent,recovery_stage,
       consecutive_successes)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(rollout_key)
      DO UPDATE SET state=EXCLUDED.state,
        traffic_percent=EXCLUDED.traffic_percent,
        recovery_stage=EXCLUDED.recovery_stage,
        consecutive_successes=EXCLUDED.consecutive_successes,
        updated_at=NOW()`,[
      req.body?.rolloutKey||"unknown",
      r.state,
      r.trafficPercent,
      r.stage,
      Number(req.body?.consecutiveSuccesses)||0
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/delegation/takeover/verify",
async(req,res)=>{
  const r=verifyTakeoverResult({
    expectedVersion:Number(
      req.body?.expectedVersion
    ),
    databaseResult:req.body?.databaseResult
  });

  try{
    await pool.query(`INSERT INTO verified_takeover_events
      (run_key,expected_version,committed_version,
       result,affected_rows)
      VALUES($1,$2,$3,$4,$5)`,[
      req.body?.runKey||"unknown",
      Number(req.body?.expectedVersion)||0,
      req.body?.databaseResult?.committedVersion||null,
      r.status,
      Number(req.body?.databaseResult?.affectedRows)||0
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/risk/joint-calibration",
async(req,res)=>{
  const r=jointCalibration({
    currentSize:Number(req.body?.currentSize),
    minWindow:Number(req.body?.minWindow)||50,
    maxWindow:Number(req.body?.maxWindow)||1000,
    driftRatio:Number(req.body?.driftRatio)||1,
    coverageError:Number(req.body?.coverageError)||0
  });

  try{
    await pool.query(`INSERT INTO joint_calibration_state
      (model_key,window_size,drift_ratio,
       coverage_error,controller_action)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(model_key)
      DO UPDATE SET window_size=EXCLUDED.window_size,
        drift_ratio=EXCLUDED.drift_ratio,
        coverage_error=EXCLUDED.coverage_error,
        controller_action=EXCLUDED.controller_action,
        updated_at=NOW()`,[
      req.body?.modelKey||"default",
      r.windowSize||Number(req.body?.currentSize),
      Number(req.body?.driftRatio)||1,
      Number(req.body?.coverageError)||0,
      r.status||"HOLD"
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/governance/alert/audit",
async(req,res)=>{
  try{
    const r=buildAuditEvent({
      fingerprint:req.body?.fingerprint,
      action:req.body?.action,
      actor:req.body?.actor||"system",
      details:req.body?.details||{}
    });

    await pool.query(`INSERT INTO alert_audit_events
      (fingerprint,action,actor,details)
      VALUES($1,$2,$3,$4)`,[
      r.fingerprint,r.action,r.actor,
      JSON.stringify(r.details)
    ]);

    res.json(r);
  }catch{
    res.status(400).json({
      status:"REJECTED",
      reason:"invalid_audit_event"
    });
  }
});

app.get("/api/security/phase126-dashboard",
async(_req,res)=>{
  try{
    const [retry,breaker,canary,takeover,calibration,audit]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM retry_telemetry
          WHERE outcome='RETRY'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM circuit_breakers WHERE state='OPEN'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM canary_recovery_controller
          WHERE state='RECOVERY'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM verified_takeover_events
          WHERE result='TAKEN_OVER'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT window_size,drift_ratio,
          coverage_error,controller_action
          FROM joint_calibration_state
          ORDER BY updated_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM alert_audit_events
          WHERE created_at>NOW()-INTERVAL '24 hours'`)
      ]);

    res.json({
      retries30d:retry.rows[0].count,
      openCircuitBreakers:breaker.rows[0].count,
      recoveringCanaries:canary.rows[0].count,
      verifiedTakeovers30d:takeover.rows[0].count,
      latestJointCalibration:calibration.rows[0]||null,
      alertAuditEvents24h:audit.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 126 dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 126 API running")
);
