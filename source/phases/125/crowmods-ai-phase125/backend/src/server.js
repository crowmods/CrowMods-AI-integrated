const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {runWithSerializableRetry}=require("./serializable-retry");
const {stagedRecovery}=require("./staged-recovery");
const {transactionalTakeover}=require("./transactional-takeover");
const {selectWindow}=require("./drift-aware-calibration");
const {routeAlert}=require("./alert-routing");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>
  res.json({status:"healthy",phase:125})
);

app.get("/ready",async(_req,res)=>{
  try{await pool.query("SELECT 1");res.json({ready:true});}
  catch{res.status(503).json({ready:false});}
});

app.post("/api/security/fencing/retry",async(req,res)=>{
  let attemptLog=[];
  const r=await runWithSerializableRetry({
    maxAttempts:Number(req.body?.maxAttempts)||4,
    baseMs:Number(req.body?.baseMs)||50,
    maxMs:Number(req.body?.maxMs)||2000,
    operation:async attempt=>{
      attemptLog.push(attempt);
      if(req.body?.simulateSerializationFailures &&
         attempt<=Number(req.body.simulateSerializationFailures)){
        const e=new Error("serialization");
        e.code="40001";
        throw e;
      }
      return {operationKey:req.body?.operationKey};
    },
    sleep:async()=>{}
  });

  for(const attempt of attemptLog){
    try{
      await pool.query(`INSERT INTO serializable_retry_events
        (operation_key,attempt,outcome,reason)
        VALUES($1,$2,$3,$4)`,[
        req.body?.operationKey||"unknown",
        attempt,
        r.status==="COMMITTED" &&
          attempt===r.attempt
          ?"COMMITTED":"RETRY",
        r.reason||null
      ]);
    }catch{}
  }

  res.json(r);
});

app.post("/api/security/canary/staged-recovery",
async(req,res)=>{
  const r=stagedRecovery({
    currentStage:Number(req.body?.currentStage)||0,
    consecutiveSuccesses:Number(
      req.body?.consecutiveSuccesses
    )||0,
    healthScore:Number(req.body?.healthScore),
    requiredSuccesses:Number(
      req.body?.requiredSuccesses
    )||3
  });

  try{
    await pool.query(`INSERT INTO canary_recovery_stages
      (rollout_key,stage,traffic_percent,
       consecutive_successes,state)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(rollout_key)
      DO UPDATE SET stage=EXCLUDED.stage,
        traffic_percent=EXCLUDED.traffic_percent,
        consecutive_successes=EXCLUDED.consecutive_successes,
        state=EXCLUDED.state,
        updated_at=NOW()`,[
      req.body?.rolloutKey||"unknown",
      r.stage||0,
      r.trafficPercent||0,
      Number(req.body?.consecutiveSuccesses)||0,
      r.state
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/delegation/takeover",
async(req,res)=>{
  const r=transactionalTakeover({
    jobStatus:req.body?.jobStatus,
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    storedFencingVersion:Number(
      req.body?.storedFencingVersion
    ),
    expectedFencingVersion:Number(
      req.body?.expectedFencingVersion
    ),
    newWorkerId:req.body?.newWorkerId,
    newLeaseToken:req.body?.newLeaseToken,
    nextLeaseExpiresAt:req.body?.nextLeaseExpiresAt
  });

  if(r.status==="TAKEN_OVER"){
    try{
      await pool.query(`UPDATE delegation_queue_jobs
        SET worker_id=$1,
            lease_token=$2,
            fencing_version=$3,
            lease_expires_at=$4,
            status='CLAIMED',
            updated_at=NOW()
        WHERE run_key=$5
          AND status='CLAIMED'
          AND lease_expires_at<=NOW()
          AND fencing_version=$6`,[
        r.newWorkerId,
        r.newLeaseToken,
        r.newFencingVersion,
        r.leaseExpiresAt,
        req.body?.runKey,
        req.body?.expectedFencingVersion
      ]);
    }catch{}
  }

  res.json(r);
});

app.post("/api/security/risk/calibration-window",
async(req,res)=>{
  const r=selectWindow({
    currentSize:Number(req.body?.currentSize),
    minWindow:Number(req.body?.minWindow)||50,
    maxWindow:Number(req.body?.maxWindow)||1000,
    driftRatio:Number(req.body?.driftRatio)||1,
    coverageError:Number(req.body?.coverageError)||0,
    targetCoverage:Number(req.body?.targetCoverage)||.9
  });

  try{
    await pool.query(`INSERT INTO drift_aware_calibration
      (model_key,window_size,drift_ratio,target_coverage)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(model_key)
      DO UPDATE SET window_size=EXCLUDED.window_size,
        drift_ratio=EXCLUDED.drift_ratio,
        target_coverage=EXCLUDED.target_coverage,
        updated_at=NOW()`,[
      req.body?.modelKey||"default",
      r.windowSize||Number(req.body?.currentSize),
      Number(req.body?.driftRatio)||1,
      Number(req.body?.targetCoverage)||.9
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/governance/alert/route",
async(req,res)=>{
  const r=routeAlert({
    severity:req.body?.severity||"INFO",
    acknowledged:Boolean(req.body?.acknowledged),
    suppressedUntil:req.body?.suppressedUntil,
    now:req.body?.now||new Date(),
    escalationLevel:Number(
      req.body?.escalationLevel
    )||0
  });

  try{
    await pool.query(`INSERT INTO alert_routing_state
      (fingerprint,acknowledged,suppressed_until,
       route,escalation_level)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(fingerprint)
      DO UPDATE SET acknowledged=EXCLUDED.acknowledged,
        suppressed_until=EXCLUDED.suppressed_until,
        route=EXCLUDED.route,
        escalation_level=EXCLUDED.escalation_level,
        updated_at=NOW()`,[
      req.body?.fingerprint||"unknown",
      Boolean(req.body?.acknowledged),
      req.body?.suppressedUntil||null,
      r.route,
      r.escalationLevel
    ]);
  }catch{}

  res.json(r);
});

app.get("/api/security/phase125-dashboard",
async(_req,res)=>{
  try{
    const [retries,recovery,takeover,calibration,alerts]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM serializable_retry_events
          WHERE outcome='RETRY'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM canary_recovery_stages
          WHERE state='RECOVERING'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM queue_takeover_transactions
          WHERE result='TAKEN_OVER'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT window_size,drift_ratio
          FROM drift_aware_calibration
          ORDER BY updated_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM alert_routing_state
          WHERE route<>'NONE'
          AND escalation_level>=2
          AND acknowledged=false`)
      ]);

    res.json({
      serializableRetries30d:
        retries.rows[0].count,
      activeRecoveryRollouts:
        recovery.rows[0].count,
      successfulTakeovers30d:
        takeover.rows[0].count,
      latestCalibrationWindow:
        calibration.rows[0]||null,
      activeEscalatedRoutes:
        alerts.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 125 dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 125 API running")
);
