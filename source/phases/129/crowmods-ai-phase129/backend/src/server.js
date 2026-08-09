const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {breakerWorkerDecision}=require("./breaker-worker");
const {
  acquireRecoveryLease,
  validateRecoveryLease
}=require("./lease-recovery-scheduler");
const {takeoverWithRetry}=require("./takeover-retry");
const {chooseCalibrationAction}=require("./confidence-calibration");
const {buildReviewQuery}=require("./alert-review");

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
  res.json({status:"healthy",phase:129})
);

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/dependency/cooldown-worker",
async(req,res)=>{
  const r=breakerWorkerDecision({
    state:req.body?.state||"OPEN",
    cooldownUntil:req.body?.cooldownUntil,
    now:req.body?.now||new Date()
  });

  try{
    await pool.query(`UPDATE breaker_cooldown_jobs
      SET state=$1,next_check_at=$2,updated_at=NOW()
      WHERE breaker_key=$3`,[
      r.nextState||req.body?.state||"OPEN",
      r.nextCheckAt||null,
      req.body?.breakerKey||"unknown"
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/canary/recovery-lease",
async(req,res)=>{
  const r=acquireRecoveryLease({
    currentWorkerId:req.body?.currentWorkerId,
    currentLeaseToken:req.body?.currentLeaseToken,
    currentVersion:Number(req.body?.currentVersion)||0,
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    workerId:req.body?.workerId,
    leaseToken:req.body?.leaseToken,
    leaseSeconds:Number(req.body?.leaseSeconds)||60
  });

  if(r.status==="ACQUIRED"){
    try{
      await pool.query(`INSERT INTO recovery_scheduler_leases
        (rollout_key,worker_id,lease_token,
         fencing_version,lease_expires_at)
        VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(rollout_key)
        DO UPDATE SET worker_id=EXCLUDED.worker_id,
          lease_token=EXCLUDED.lease_token,
          fencing_version=EXCLUDED.fencing_version,
          lease_expires_at=EXCLUDED.lease_expires_at,
          updated_at=NOW()`,[
        req.body?.rolloutKey||"unknown",
        r.workerId,
        r.leaseToken,
        r.fencingVersion,
        r.leaseExpiresAt
      ]);
    }catch{}
  }

  res.json(r);
});

app.post("/api/security/delegation/takeover/retry",
async(req,res)=>{
  let attempts=0;

  const r=await takeoverWithRetry({
    maxAttempts:Number(req.body?.maxAttempts)||3,
    sleep:async()=>{},
    execute:async attempt=>{
      attempts=attempt;

      try{
        const db=await pool.query(
          `SELECT * FROM execute_verified_takeover($1,$2,$3,$4,$5)`,
          [
            req.body?.runKey,
            Number(req.body?.expectedVersion),
            req.body?.newWorkerId,
            req.body?.newLeaseToken,
            req.body?.newLeaseExpiresAt
          ]
        );

        const row=db.rows[0];
        return {
          status:row.result,
          affectedRows:Number(row.affected_rows),
          committedVersion:
            row.committed_version===null
              ?null:Number(row.committed_version)
        };
      }catch(error){
        throw error;
      }
    }
  });

  try{
    await pool.query(`INSERT INTO takeover_retry_events
      (run_key,attempt,outcome,reason)
      VALUES($1,$2,$3,$4)`,[
      req.body?.runKey||"unknown",
      attempts,
      r.status,
      r.reason||null
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/risk/confidence-calibration",
async(req,res)=>{
  const r=chooseCalibrationAction({
    sampleCount:Number(req.body?.sampleCount),
    coverage:Number(req.body?.coverage),
    lowerBound:Number(req.body?.lowerBound),
    upperBound:Number(req.body?.upperBound),
    targetCoverage:Number(
      req.body?.targetCoverage
    )||.9,
    tolerance:Number(req.body?.tolerance)||.03,
    minWindow:Number(req.body?.minWindow)||50,
    currentWindow:Number(
      req.body?.currentWindow
    )||100,
    maxWindow:Number(req.body?.maxWindow)||1000
  });

  try{
    await pool.query(`INSERT INTO confidence_calibration_actions
      (model_key,coverage,lower_bound,upper_bound,
       target_coverage,action)
      VALUES($1,$2,$3,$4,$5,$6)`,[
      req.body?.modelKey||"default",
      Number(req.body?.coverage)||null,
      Number(req.body?.lowerBound)||null,
      Number(req.body?.upperBound)||null,
      Number(req.body?.targetCoverage)||.9,
      r.action
    ]);
  }catch{}

  res.json(r);
});

app.get("/api/security/governance/alert/review",
async(req,res)=>{
  try{
    const query=buildReviewQuery({
      reviewer:req.query.reviewer,
      fingerprint:req.query.fingerprint,
      actionFilter:req.query.action,
      fromTime:req.query.from,
      toTime:req.query.to,
      limit:req.query.limit
    });

    await pool.query(`INSERT INTO alert_review_queries
      (reviewer,fingerprint,action_filter,from_time,to_time)
      VALUES($1,$2,$3,$4,$5)`,[
      req.query.reviewer,
      req.query.fingerprint||null,
      req.query.action||null,
      req.query.from||null,
      req.query.to||null
    ]);

    const result=await pool.query(
      query.sql,
      query.params
    );

    res.json({
      count:result.rowCount,
      events:result.rows
    });
  }catch{
    res.status(400).json({
      error:"Invalid alert review query"
    });
  }
});

app.get("/api/security/phase129-dashboard",
async(_req,res)=>{
  try{
    const [breakers,leases,retries,calibration,reviews]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM breaker_cooldown_jobs
          WHERE state='OPEN'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM recovery_scheduler_leases
          WHERE lease_expires_at>NOW()`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM takeover_retry_events
          WHERE outcome='TAKEN_OVER'
          AND created_at>NOW()-INTERVAL '30 days'`),
        pool.query(`SELECT action
          FROM confidence_calibration_actions
          ORDER BY created_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM alert_review_queries
          WHERE created_at>NOW()-INTERVAL '30 days'`)
      ]);

    res.json({
      openBreakerJobs:breakers.rows[0].count,
      activeRecoveryLeases:leases.rows[0].count,
      successfulTakeoverRetries30d:retries.rows[0].count,
      latestCalibrationAction:
        calibration.rows[0]?.action||null,
      alertReviewQueries30d:reviews.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 129 dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 129 API running")
);
