const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  recordDependencyMetrics,
  dependencyHealth
}=require("./dependency-circuit-metrics");
const {persistentCooldown}=require("./persistent-cooldown");
const {enforceTakeoverResult}=require("./enforced-takeover");
const {wilsonInterval}=require("./coverage-confidence");
const {acknowledgeAlert}=require("./alert-ack");

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
  res.json({status:"healthy",phase:127})
);

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/dependency/metrics",
async(req,res)=>{
  const metrics=recordDependencyMetrics({
    state:req.body?.state||"CLOSED",
    requestCount:Number(req.body?.requestCount)||0,
    failureCount:Number(req.body?.failureCount)||0,
    timeoutCount:Number(req.body?.timeoutCount)||0,
    latencySamples:req.body?.latencySamples||[]
  });

  const health=dependencyHealth({
    failureRate:metrics.failureRate,
    timeoutRate:metrics.requestCount
      ?metrics.timeoutCount/metrics.requestCount:0,
    latencyP95Ms:metrics.latencyP95Ms||0
  });

  try{
    await pool.query(`INSERT INTO dependency_circuit_metrics
      (dependency_key,state,request_count,failure_count,
       timeout_count,latency_p95_ms,failure_rate)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(dependency_key)
      DO UPDATE SET state=EXCLUDED.state,
        request_count=EXCLUDED.request_count,
        failure_count=EXCLUDED.failure_count,
        timeout_count=EXCLUDED.timeout_count,
        latency_p95_ms=EXCLUDED.latency_p95_ms,
        failure_rate=EXCLUDED.failure_rate,
        updated_at=NOW()`,[
      req.body?.dependencyKey||"unknown",
      metrics.state,
      metrics.requestCount,
      metrics.failureCount,
      metrics.timeoutCount,
      metrics.latencyP95Ms,
      metrics.failureRate
    ]);
  }catch{}

  res.json({...metrics,health});
});

app.post("/api/security/canary/persistent-cooldown",
async(req,res)=>{
  const r=persistentCooldown({
    state:req.body?.state||"ROLLBACK",
    failureStreak:Number(req.body?.failureStreak)||0,
    recoveryStreak:Number(req.body?.recoveryStreak)||0,
    cooldownUntil:req.body?.cooldownUntil,
    healthScore:Number(req.body?.healthScore),
    now:req.body?.now||new Date(),
    failureThreshold:Number(req.body?.failureThreshold)||2,
    recoveryThreshold:Number(req.body?.recoveryThreshold)||.8,
    requiredRecoveryStreak:Number(
      req.body?.requiredRecoveryStreak
    )||3,
    cooldownMs:Number(req.body?.cooldownMs)||300000
  });

  try{
    await pool.query(`INSERT INTO canary_persistent_cooldowns
      (rollout_key,cooldown_until,failure_streak,
       recovery_streak,state)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(rollout_key)
      DO UPDATE SET cooldown_until=EXCLUDED.cooldown_until,
        failure_streak=EXCLUDED.failure_streak,
        recovery_streak=EXCLUDED.recovery_streak,
        state=EXCLUDED.state,
        updated_at=NOW()`,[
      req.body?.rolloutKey||"unknown",
      r.cooldownUntil||null,
      r.failureStreak||0,
      r.recoveryStreak||0,
      r.state
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/delegation/takeover/enforce",
async(req,res)=>{
  const r=enforceTakeoverResult({
    expectedVersion:Number(
      req.body?.expectedVersion
    ),
    affectedRows:Number(
      req.body?.affectedRows
    ),
    committedVersion:Number(
      req.body?.committedVersion
    )
  });

  try{
    await pool.query(`INSERT INTO takeover_verification_events
      (run_key,expected_version,committed_version,
       affected_rows,result)
      VALUES($1,$2,$3,$4,$5)`,[
      req.body?.runKey||"unknown",
      Number(req.body?.expectedVersion)||0,
      Number(req.body?.committedVersion)||null,
      Number(req.body?.affectedRows)||0,
      r.status
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/risk/coverage-confidence",
async(req,res)=>{
  const r=wilsonInterval({
    successes:Number(req.body?.successes),
    trials:Number(req.body?.trials),
    confidenceLevel:Number(
      req.body?.confidenceLevel
    )||.95
  });

  if(r.status==="CALCULATED"){
    try{
      await pool.query(`INSERT INTO coverage_confidence_metrics
        (model_key,sample_count,coverage,confidence_level,
         lower_bound,upper_bound)
        VALUES($1,$2,$3,$4,$5,$6)`,[
        req.body?.modelKey||"default",
        r.sampleCount,
        r.coverage,
        r.confidenceLevel,
        r.lowerBound,
        r.upperBound
      ]);
    }catch{}
  }

  res.json(r);
});

app.post("/api/security/governance/alert/acknowledge",
async(req,res)=>{
  const r=acknowledgeAlert({
    fingerprint:req.body?.fingerprint,
    actor:req.body?.actor,
    note:req.body?.note||"",
    acknowledged:req.body?.acknowledged!==false,
    now:req.body?.now||new Date()
  });

  if(r.status!=="REJECTED"){
    try{
      await pool.query(`INSERT INTO alert_acknowledgements
        (fingerprint,acknowledged,acknowledged_by,
         acknowledged_at,note)
        VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(fingerprint)
        DO UPDATE SET acknowledged=EXCLUDED.acknowledged,
          acknowledged_by=EXCLUDED.acknowledged_by,
          acknowledged_at=EXCLUDED.acknowledged_at,
          note=EXCLUDED.note,
          updated_at=NOW()`,[
        r.fingerprint,
        r.status==="ACKNOWLEDGED",
        r.actor,
        r.acknowledgedAt,
        r.note
      ]);
    }catch{}
  }

  res.json(r);
});

app.get("/api/security/phase127-dashboard",
async(_req,res)=>{
  try{
    const [deps,cooldowns,takeovers,coverage,acks]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM dependency_circuit_metrics
          WHERE state='OPEN'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM canary_persistent_cooldowns
          WHERE state='COOLDOWN'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM takeover_verification_events
          WHERE result='TAKEN_OVER'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT coverage,lower_bound,upper_bound
          FROM coverage_confidence_metrics
          ORDER BY created_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM alert_acknowledgements
          WHERE acknowledged=true
          AND updated_at>NOW()-INTERVAL '30 days'`)
      ]);

    res.json({
      openDependencies:deps.rows[0].count,
      canaryCooldowns:cooldowns.rows[0].count,
      verifiedTakeovers30d:takeovers.rows[0].count,
      latestCoverageConfidence:coverage.rows[0]||null,
      acknowledgedAlerts30d:acks.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 127 dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 127 API running")
);


module.exports = app;
