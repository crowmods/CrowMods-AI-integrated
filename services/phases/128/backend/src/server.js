const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {transitionBreaker}=require("./automatic-breaker");
const {scheduleRecovery}=require("./recovery-scheduler");
const {executeVerifiedTakeover}=require("./verified-sql-takeover");
const {updateSequentialCoverage}=require("./sequential-coverage");
const {alertHistoryEvent}=require("./alert-history");

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
  res.json({status:"healthy",phase:128})
);

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/dependency/auto-breaker",
async(req,res)=>{
  const r=transitionBreaker({
    state:req.body?.state||"CLOSED",
    failureRate:Number(req.body?.failureRate)||0,
    timeoutRate:Number(req.body?.timeoutRate)||0,
    latencyP95Ms:Number(req.body?.latencyP95Ms)||0,
    now:req.body?.now||new Date(),
    failureThreshold:Number(req.body?.failureThreshold)||.05,
    timeoutThreshold:Number(req.body?.timeoutThreshold)||.03,
    latencyThreshold:Number(req.body?.latencyThreshold)||1000,
    halfOpenAfterMs:Number(req.body?.halfOpenAfterMs)||30000,
    openedAt:req.body?.openedAt
  });

  try{
    await pool.query(`INSERT INTO dependency_breaker_events
      (dependency_key,previous_state,next_state,
       failure_rate,timeout_rate,latency_p95_ms,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,[
      req.body?.dependencyKey||"unknown",
      req.body?.state||"CLOSED",
      r.state,
      Number(req.body?.failureRate)||0,
      Number(req.body?.timeoutRate)||0,
      Number(req.body?.latencyP95Ms)||0,
      r.reason
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/canary/recovery-schedule",
async(req,res)=>{
  const r=scheduleRecovery({
    state:req.body?.state||"ROLLBACK",
    stage:Number(req.body?.stage)||0,
    now:req.body?.now||new Date(),
    cooldownUntil:req.body?.cooldownUntil,
    checkIntervalMs:Number(
      req.body?.checkIntervalMs
    )||60000
  });

  try{
    await pool.query(`INSERT INTO canary_recovery_schedule
      (rollout_key,state,next_check_at,cooldown_until,stage)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(rollout_key)
      DO UPDATE SET state=EXCLUDED.state,
        next_check_at=EXCLUDED.next_check_at,
        cooldown_until=EXCLUDED.cooldown_until,
        stage=EXCLUDED.stage,
        updated_at=NOW()`,[
      req.body?.rolloutKey||"unknown",
      r.state,
      r.nextCheckAt||null,
      r.cooldownUntil||null,
      r.stage||0
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/delegation/takeover/execute",
async(req,res)=>{
  try{
    const r=await executeVerifiedTakeover(pool,{
      runKey:req.body?.runKey,
      expectedVersion:Number(
        req.body?.expectedVersion
      ),
      newWorkerId:req.body?.newWorkerId,
      newLeaseToken:req.body?.newLeaseToken,
      newLeaseExpiresAt:req.body?.newLeaseExpiresAt
    });

    try{
      await pool.query(`INSERT INTO takeover_execution_events
        (run_key,expected_version,committed_version,
         affected_rows,result)
        VALUES($1,$2,$3,$4,$5)`,[
        req.body?.runKey||"unknown",
        Number(req.body?.expectedVersion)||0,
        r.committedVersion||null,
        r.affectedRows||0,
        r.status
      ]);
    }catch{}

    res.json(r);
  }catch{
    res.status(500).json({
      status:"REJECTED",
      reason:"takeover_sql_execution_failed"
    });
  }
});

app.post("/api/security/risk/sequential-coverage",
async(req,res)=>{
  const r=updateSequentialCoverage({
    coveredCount:Number(req.body?.coveredCount)||0,
    sampleCount:Number(req.body?.sampleCount)||0,
    additionalCovered:Number(
      req.body?.additionalCovered
    )||0,
    additionalSamples:Number(
      req.body?.additionalSamples
    )||0,
    targetCoverage:Number(
      req.body?.targetCoverage
    )||.9,
    tolerance:Number(req.body?.tolerance)||.03
  });

  try{
    await pool.query(`INSERT INTO sequential_coverage_monitor
      (model_key,sample_count,covered_count,coverage,
       target_coverage,lower_bound,upper_bound,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(model_key)
      DO UPDATE SET sample_count=EXCLUDED.sample_count,
        covered_count=EXCLUDED.covered_count,
        coverage=EXCLUDED.coverage,
        target_coverage=EXCLUDED.target_coverage,
        lower_bound=EXCLUDED.lower_bound,
        upper_bound=EXCLUDED.upper_bound,
        status=EXCLUDED.status,
        updated_at=NOW()`,[
      req.body?.modelKey||"default",
      r.sampleCount,
      r.coveredCount,
      r.coverage||null,
      Number(req.body?.targetCoverage)||.9,
      r.lowerBound||null,
      r.upperBound||null,
      r.status
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/governance/alert/history",
async(req,res)=>{
  const r=alertHistoryEvent({
    fingerprint:req.body?.fingerprint,
    action:req.body?.action,
    actor:req.body?.actor,
    note:req.body?.note||""
  });

  if(r.status==="RECORDED"){
    try{
      await pool.query(`INSERT INTO alert_ack_history
        (fingerprint,action,actor,note)
        VALUES($1,$2,$3,$4)`,[
        r.fingerprint,r.action,r.actor,r.note
      ]);
    }catch{}
  }

  res.json(r);
});

app.get("/api/security/phase128-dashboard",
async(_req,res)=>{
  try{
    const [breakers,recovery,takeovers,coverage,history]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM dependency_breaker_events
          WHERE next_state='OPEN'
          AND created_at>NOW()-INTERVAL '24 hours'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM canary_recovery_schedule
          WHERE state='RECOVERY'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM takeover_execution_events
          WHERE result='TAKEN_OVER'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT coverage,lower_bound,upper_bound,status
          FROM sequential_coverage_monitor
          ORDER BY updated_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM alert_ack_history
          WHERE created_at>NOW()-INTERVAL '30 days'`)
      ]);

    res.json({
      breakerOpens24h:breakers.rows[0].count,
      scheduledRecoveries:recovery.rows[0].count,
      verifiedTakeovers30d:takeovers.rows[0].count,
      latestSequentialCoverage:coverage.rows[0]||null,
      alertHistoryEvents30d:history.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 128 dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 128 API running")
);


module.exports = app;
