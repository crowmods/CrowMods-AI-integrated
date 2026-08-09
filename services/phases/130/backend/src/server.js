const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {failoverDecision}=require("./worker-failover");
const {renewLease}=require("./renewal-fencing");
const {retryPlan}=require("./retry-backoff-telemetry");
const {sequentialCalibration}=require("./sequential-calibration-controller");
const {
  authorizeReview,
  paginate
}=require("./alert-review-access");

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
  res.json({status:"healthy",phase:130})
);

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/worker/failover",
async(req,res)=>{
  const r=failoverDecision({
    activeWorkerId:req.body?.activeWorkerId,
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    candidateWorkerId:req.body?.candidateWorkerId,
    candidateLeaseToken:req.body?.candidateLeaseToken,
    currentFencingVersion:Number(
      req.body?.currentFencingVersion
    )||0
  });

  if(r.status==="FAILED_OVER"){
    try{
      await pool.query(`INSERT INTO worker_lease_failover
        (worker_key,active_worker_id,lease_token,
         fencing_version,lease_expires_at,state)
        VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(worker_key)
        DO UPDATE SET active_worker_id=EXCLUDED.active_worker_id,
          lease_token=EXCLUDED.lease_token,
          fencing_version=EXCLUDED.fencing_version,
          lease_expires_at=EXCLUDED.lease_expires_at,
          state=EXCLUDED.state,
          updated_at=NOW()`,[
        req.body?.workerKey||"unknown",
        r.workerId,
        r.leaseToken,
        r.fencingVersion,
        req.body?.newLeaseExpiresAt||null,
        r.status
      ]);
    }catch{}
  }

  res.json(r);
});

app.post("/api/security/worker/renew",
async(req,res)=>{
  const r=renewLease({
    workerId:req.body?.workerId,
    expectedWorkerId:req.body?.expectedWorkerId,
    leaseToken:req.body?.leaseToken,
    expectedLeaseToken:req.body?.expectedLeaseToken,
    expectedFencingVersion:Number(
      req.body?.expectedFencingVersion
    ),
    currentFencingVersion:Number(
      req.body?.currentFencingVersion
    ),
    leaseExpiresAt:req.body?.leaseExpiresAt,
    now:req.body?.now||new Date(),
    extensionMs:Number(
      req.body?.extensionMs
    )||60000
  });

  try{
    await pool.query(`INSERT INTO scheduler_renewal_events
      (worker_key,worker_id,lease_token,
       expected_fencing_version,committed_fencing_version,
       result)
      VALUES($1,$2,$3,$4,$5,$6)`,[
      req.body?.workerKey||"unknown",
      req.body?.workerId||"unknown",
      req.body?.leaseToken||"unknown",
      Number(req.body?.expectedFencingVersion)||0,
      r.fencingVersion||null,
      r.status
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/delegation/takeover/retry-plan",
async(req,res)=>{
  const r=retryPlan({
    attempt:Number(req.body?.attempt)||1,
    retryable:req.body?.retryable!==false,
    maxAttempts:Number(req.body?.maxAttempts)||3
  });

  try{
    await pool.query(`INSERT INTO takeover_retry_telemetry
      (run_key,attempt,delay_ms,outcome)
      VALUES($1,$2,$3,$4)`,[
      req.body?.runKey||"unknown",
      Number(req.body?.attempt)||1,
      r.delayMs||0,
      r.action==="RETRY"?"RETRY":"ABORTED"
    ]);
  }catch{}

  res.json(r);
});

app.post("/api/security/risk/sequential-calibration",
async(req,res)=>{
  const r=sequentialCalibration({
    coveredCount:Number(req.body?.coveredCount)||0,
    sampleCount:Number(req.body?.sampleCount)||0,
    targetCoverage:Number(
      req.body?.targetCoverage
    )||.9,
    tolerance:Number(req.body?.tolerance)||.03,
    currentWindow:Number(
      req.body?.currentWindow
    )||100,
    minWindow:Number(req.body?.minWindow)||50,
    maxWindow:Number(req.body?.maxWindow)||1000,
    additionalCovered:Number(
      req.body?.additionalCovered
    )||0,
    additionalSamples:Number(
      req.body?.additionalSamples
    )||0
  });

  try{
    await pool.query(`INSERT INTO sequential_calibration_controller
      (model_key,sample_count,covered_count,target_coverage,
       lower_bound,upper_bound,action,window_size)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(model_key)
      DO UPDATE SET sample_count=EXCLUDED.sample_count,
        covered_count=EXCLUDED.covered_count,
        target_coverage=EXCLUDED.target_coverage,
        lower_bound=EXCLUDED.lower_bound,
        upper_bound=EXCLUDED.upper_bound,
        action=EXCLUDED.action,
        window_size=EXCLUDED.window_size,
        updated_at=NOW()`,[
      req.body?.modelKey||"default",
      r.sampleCount,
      r.coveredCount,
      Number(req.body?.targetCoverage)||.9,
      r.lowerBound||null,
      r.upperBound||null,
      r.action,
      r.windowSize
    ]);
  }catch{}

  res.json(r);
});

app.get("/api/security/governance/alert/review-access",
async(req,res)=>{
  const auth=authorizeReview({
    role:req.query.role,
    action:req.query.action||"VIEW"
  });

  const page=paginate({
    page:req.query.page,
    pageSize:req.query.pageSize
  });

  try{
    await pool.query(`INSERT INTO alert_review_access_events
      (reviewer,role_name,fingerprint,action_filter,
       page,page_size,result)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,[
      req.query.reviewer||"unknown",
      req.query.role||"unknown",
      req.query.fingerprint||null,
      req.query.action||null,
      page.page,
      page.pageSize,
      auth.allowed?"ALLOWED":"DENIED"
    ]);
  }catch{}

  if(!auth.allowed)
    return res.status(403).json(auth);

  try{
    const params=[];
    const where=[];

    if(req.query.fingerprint){
      params.push(req.query.fingerprint);
      where.push(`fingerprint=$${params.length}`);
    }

    if(req.query.actionFilter){
      params.push(req.query.actionFilter);
      where.push(`action=$${params.length}`);
    }

    const clause=where.length
      ?`WHERE ${where.join(" AND ")}`
      :"";

    const result=await pool.query(
      `SELECT fingerprint,action,actor,note,created_at
       FROM alert_ack_history
       ${clause}
       ORDER BY created_at DESC
       LIMIT ${page.pageSize}
       OFFSET ${page.offset}`,
      params
    );

    res.json({
      page:page.page,
      pageSize:page.pageSize,
      count:result.rowCount,
      events:result.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load alert review"
    });
  }
});

app.get("/api/security/phase130-dashboard",
async(_req,res)=>{
  try{
    const [failover,renewals,retries,calibration,reviews]=
      await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count
          FROM worker_lease_failover
          WHERE state='FAILED_OVER'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM scheduler_renewal_events
          WHERE result='RENEWED'
          AND created_at>NOW()-INTERVAL '24 hours'`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM takeover_retry_telemetry
          WHERE outcome='RETRY'
          AND created_at>NOW()-INTERVAL '24 hours'`),
        pool.query(`SELECT action,window_size
          FROM sequential_calibration_controller
          ORDER BY updated_at DESC LIMIT 1`),
        pool.query(`SELECT COUNT(*)::int AS count
          FROM alert_review_access_events
          WHERE result='DENIED'
          AND created_at>NOW()-INTERVAL '30 days'`)
      ]);

    res.json({
      failedOverWorkers:failover.rows[0].count,
      leaseRenewals24h:renewals.rows[0].count,
      takeoverRetries24h:retries.rows[0].count,
      latestCalibration:
        calibration.rows[0]||null,
      deniedAlertReviews30d:reviews.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load Phase 130 dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>
  console.log("CrowMods Phase 130 API running")
);


module.exports = app;
