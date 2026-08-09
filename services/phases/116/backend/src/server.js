const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  renewLock,
  releaseLock
}=require("./lock-heartbeat");
const {
  replayDlq,
  quarantineDlq
}=require("./dlq-controls");
const {
  validateDelegation,
  canDelegateApproval
}=require("./approval-delegation");
const {
  calculateRiskTrend
}=require("./risk-trends");
const {
  validateDecision
}=require("./decision-record");

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
  phase:116
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/worker-lock/renew",
async(req,res)=>{
  const result=renewLock({
    lock:req.body?.lock,
    ownerId:req.body?.ownerId,
    now:req.body?.now||new Date(),
    extensionSeconds:
      Number(req.body?.extensionSeconds)||300
  });

  if(result.status==="RENEWED"){
    try{
      await pool.query(`
        INSERT INTO worker_lock_heartbeats
          (lock_id,owner_id,new_expires_at)
        VALUES($1,$2,$3)
      `,[
        result.lockId,
        result.ownerId,
        result.newExpiresAt
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/worker-lock/release",
(req,res)=>{
  res.json(releaseLock({
    lock:req.body?.lock,
    ownerId:req.body?.ownerId
  }));
});

app.post("/api/security/dlq/replay",
async(req,res)=>{
  const result=replayDlq({
    deadLetter:req.body?.deadLetter,
    requestedBy:req.body?.requestedBy,
    replayKey:req.body?.replayKey
  });

  if(result.status==="REPLAYED"){
    try{
      await pool.query(`
        INSERT INTO dlq_replay_attempts
          (dead_letter_id,replayed_by,
           replay_key,status)
        VALUES($1,$2,$3,'REPLAYED')
        ON CONFLICT(replay_key) DO NOTHING
      `,[
        result.deadLetterId,
        result.replayedBy,
        result.replayKey
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/dlq/quarantine",
async(req,res)=>{
  const result=quarantineDlq({
    deadLetter:req.body?.deadLetter,
    quarantinedBy:req.body?.quarantinedBy,
    reason:req.body?.reason
  });

  if(result.status==="QUARANTINED"){
    try{
      await pool.query(`
        INSERT INTO dlq_quarantine
          (dead_letter_id,quarantined_by,reason)
        VALUES($1,$2,$3)
      `,[
        result.deadLetterId,
        result.quarantinedBy,
        result.reason
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk/delegation",
(req,res)=>{
  res.json(validateDelegation({
    delegator:req.body?.delegator,
    delegate:req.body?.delegate,
    approvalLevel:
      Number(req.body?.approvalLevel),
    startsAt:req.body?.startsAt,
    endsAt:req.body?.endsAt
  }));
});

app.post("/api/security/risk/delegation/check",
(req,res)=>{
  res.json({
    allowed:canDelegateApproval({
      delegator:req.body?.delegator,
      delegate:req.body?.delegate,
      originalApprover:
        req.body?.originalApprover,
      decisionMaker:req.body?.decisionMaker
    })
  });
});

app.post("/api/security/risk/trend",
async(req,res)=>{
  const result=calculateRiskTrend(
    req.body?.scores||[]
  );

  try{
    await pool.query(`
      INSERT INTO risk_trend_snapshots
        (period_start,period_end,
         open_risks,critical_risks,
         average_residual_score,trend)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      req.body?.periodStart||new Date(),
      req.body?.periodEnd||new Date(),
      Number(req.body?.openRisks)||0,
      Number(req.body?.criticalRisks)||0,
      Number(req.body?.averageResidualScore)||0,
      result.trend
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/executive/decision",
async(req,res)=>{
  const result=validateDecision({
    decision:req.body?.decision,
    rationale:req.body?.rationale,
    decisionMaker:req.body?.decisionMaker
  });

  if(result.status==="VALID"){
    try{
      await pool.query(`
        INSERT INTO executive_decision_records
          (risk_id,decision,rationale,
           decision_maker,evidence_refs)
        VALUES($1,$2,$3,$4,$5)
      `,[
        req.body?.riskId||null,
        result.decision,
        result.rationale,
        result.decisionMaker,
        JSON.stringify(req.body?.evidenceRefs||[])
      ]);
    }catch{}
  }

  res.json(result);
});

app.get("/api/security/executive-operations-dashboard",
async(_req,res)=>{
  try{
    const [heartbeats,replays,
           quarantine,decisions]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM worker_lock_heartbeats
          WHERE heartbeat_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM dlq_replay_attempts
          WHERE created_at>NOW()-INTERVAL '30 days'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM dlq_quarantine
          WHERE status='QUARANTINED'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM executive_decision_records
          WHERE decided_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      lockHeartbeats24h:
        heartbeats.rows[0].count,
      dlqReplays30d:
        replays.rows[0].count,
      quarantinedDlqItems:
        quarantine.rows[0].count,
      executiveDecisions30d:
        decisions.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load executive operations dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 116 Executive Operations API running"
));


module.exports = app;
