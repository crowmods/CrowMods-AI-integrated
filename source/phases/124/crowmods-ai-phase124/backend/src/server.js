const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {serializableCas}=require("./serializable-cas");
const {evaluateRecovery}=require("./canary-cooldown");
const {validateTakeover}=require("./queue-takeover");
const {adjustWindow}=require("./adaptive-window");
const {buildAlert}=require("./alert-escalation");

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
  res.json({status:"healthy",phase:124})
);

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/fencing/serializable",
async(req,res)=>{
  try{
    const r=await serializableCas(pool,{
      resourceKey:req.body?.resourceKey,
      expectedVersion:Number(
        req.body?.expectedVersion
      ),
      nextDigest:req.body?.nextDigest
    });
    res.json(r);
  }catch{
    res.status(500).json({
      status:"ABORTED",
      reason:"serializable_transaction_error"
    });
  }
});

app.post("/api/security/canary/recovery",
async(req,res)=>{
  const r=evaluateRecovery({
    healthScore:Number(req.body?.healthScore),
    consecutiveSuccesses:Number(
      req.body?.consecutiveSuccesses
    )||0,
    cooldownUntil:req.body?.cooldownUntil,
    now:req.body?.now||new Date(),
    recoveryThreshold:Number(
      req.body?.recoveryThreshold
    )||.8,
    requiredSuccesses:Number(
      req.body?.requiredSuccesses
    )||3,
    cooldownSeconds:Number(
      req.body?.cooldownSeconds
    )||300
  });

  try{
    await pool.query(`INSERT INTO canary_recovery_windows
      (rollout_key,cooldown_until,
       consecutive_successes,recovery_state)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(rollout_key)
      DO UPDATE SET cooldown_until=EXCLUDED.cooldown_until,
        consecutive_successes=EXCLUDED.consecutive_successes,
        recovery_state=EXCLUDED.recovery_state,
        updated_at=NOW()`,[
      req.body?.rolloutKey||"unknown",
      r.cooldownUntil||null,
      Number(req.body?.consecutiveSuccesses)||0,
      r.action==="COOLDOWN"?"COOLDOWN":
        r.action==="STABLE"?"STABLE":"RECOVERING"
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/delegation/takeover",
async(req,res)=>{
  const r=validateTakeover({
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    expectedFencingVersion:Number(
      req.body?.expectedFencingVersion
    ),
    currentFencingVersion:Number(
      req.body?.currentFencingVersion
    )
  });

  if(r.status==="TAKEOVER_ALLOWED"){
    try{
      await pool.query(`UPDATE delegation_queue_jobs
        SET worker_id=$1,
            lease_token=$2,
            fencing_version=fencing_version+1,
            status='CLAIMED',
            lease_expires_at=$3,
            updated_at=NOW()
        WHERE run_key=$4
          AND status='CLAIMED'
          AND lease_expires_at<=NOW()
          AND fencing_version=$5`,[
        req.body?.newWorkerId,
        req.body?.newLeaseToken,
        req.body?.newLeaseExpiresAt,
        req.body?.runKey,
        Number(req.body?.expectedFencingVersion)
      ]);
    }catch{}
  }

  res.json(r);
});

app.post("/api/security/risk/calibration-window",
async(req,res)=>{
  const r=adjustWindow({
    currentSize:Number(req.body?.currentSize),
    minWindow:Number(req.body?.minWindow)||50,
    maxWindow:Number(req.body?.maxWindow)||1000,
    coverageError:Number(req.body?.coverageError),
    targetError:Number(req.body?.targetError)||.05
  });

  try{
    await pool.query(`INSERT INTO calibration_windows
      (model_key,window_size,min_window,max_window,coverage_error)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(model_key)
      DO UPDATE SET window_size=EXCLUDED.window_size,
        min_window=EXCLUDED.min_window,
        max_window=EXCLUDED.max_window,
        coverage_error=EXCLUDED.coverage_error,
        updated_at=NOW()`,[
      req.body?.modelKey||"default",
      r.windowSize||Number(req.body?.currentSize),
      Number(req.body?.minWindow)||50,
      Number(req.body?.maxWindow)||1000,
      Number(req.body?.coverageError)||0
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/governance/alert",
async(req,res)=>{
  const r=buildAlert({
    alertType:req.body?.alertType,
    message:req.body?.message,
    resourceKey:req.body?.resourceKey||"",
    severity:req.body?.severity||"INFO",
    occurrences:Number(req.body?.occurrences)||1
  });

  try{
    await pool.query(`INSERT INTO governance_alerts
      (fingerprint,alert_type,severity,occurrences,message,
       escalated,last_seen_at)
      VALUES($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT(fingerprint)
      DO UPDATE SET occurrences=governance_alerts.occurrences+1,
        last_seen_at=NOW(),
        severity=EXCLUDED.severity,
        escalated=EXCLUDED.escalated`,[
      r.fingerprint,
      r.alertType,
      r.severity,
      r.occurrences,
      r.message,
      r.escalated
    ]);
  }catch{}

  res.json(r);
});

app.get("/api/security/phase124-dashboard",
async(_req,res)=>{
  try{
    const [cas,recovery,takeover,calibration,alerts]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM protected_resources
          WHERE updated_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM canary_recovery_windows
          WHERE recovery_state='COOLDOWN'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM delegation_queue_jobs
          WHERE status='CLAIMED'
          AND updated_at>NOW()-INTERVAL '24 hours'`),
        pool.query(`SELECT window_size,coverage_error
          FROM calibration_windows
          ORDER BY updated_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM governance_alerts
          WHERE escalated=true AND acknowledged=false`)
      ]);

    res.json({
      protectedResourcesUpdated30d:
        cas.rows[0].count,
      canaryRolloutsInCooldown:
        recovery.rows[0].count,
      activeTakeoverClaims24h:
        takeover.rows[0].count,
      latestCalibrationWindow:
        calibration.rows[0]||null,
      unacknowledgedEscalatedAlerts:
        alerts.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 124 dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 124 API running")
);
