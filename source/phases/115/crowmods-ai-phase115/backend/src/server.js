const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  createLockToken,
  lockExpiry,
  canAcquireLock
}=require("./distributed-lock");
const {
  calculateJitteredRetry
}=require("./retry-jitter");
const {
  createApprovalChain,
  applyDecision
}=require("./risk-approval");
const {
  calculateResidualRisk
}=require("./risk-register");

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
  phase:115
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/worker-lock/acquire",
async(req,res)=>{
  const resourceKey=req.body?.resourceKey;
  const ownerId=req.body?.ownerId;

  if(!resourceKey||!ownerId)
    return res.status(400).json({
      status:"BLOCKED",
      reason:"resource_and_owner_required"
    });

  const token=createLockToken();
  const expiry=lockExpiry({
    now:req.body?.now||new Date(),
    leaseSeconds:
      Number(req.body?.leaseSeconds)||300
  });

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const existing=await client.query(`
      SELECT *
      FROM worker_locks
      WHERE resource_key=$1
      FOR UPDATE
    `,[resourceKey]);

    const row=existing.rows[0];

    if(!canAcquireLock({
      existing:row&&{
        status:row.status,
        expiresAt:row.expires_at
      },
      now:req.body?.now||new Date()
    })){
      await client.query("ROLLBACK");
      return res.status(409).json({
        status:"HELD"
      });
    }

    await client.query(`
      INSERT INTO worker_locks
        (resource_key,owner_id,
         lock_token,expires_at,status)
      VALUES($1,$2,$3,$4,'HELD')
      ON CONFLICT(resource_key)
      DO UPDATE SET
        owner_id=EXCLUDED.owner_id,
        lock_token=EXCLUDED.lock_token,
        expires_at=EXCLUDED.expires_at,
        status='HELD'
    `,[
      resourceKey,
      ownerId,
      token,
      expiry
    ]);

    await client.query("COMMIT");

    res.json({
      status:"HELD",
      resourceKey,
      ownerId,
      lockToken:token,
      expiresAt:expiry
    });
  }catch{
    await client.query("ROLLBACK");
    res.status(500).json({
      error:"Could not acquire worker lock"
    });
  }finally{
    client.release();
  }
});

app.post("/api/security/retry/jitter",
async(req,res)=>{
  try{
    const result=calculateJitteredRetry({
      attempt:Number(req.body?.attempt),
      maxAttempts:
        Number(req.body?.maxAttempts)||5,
      baseDelaySeconds:
        Number(req.body?.baseDelaySeconds)||10,
      maxDelaySeconds:
        Number(req.body?.maxDelaySeconds)||900,
      jitterRatio:
        Number(req.body?.jitterRatio)||.25
    });

    if(result.deadLetter&&req.body?.jobId){
      try{
        await pool.query(`
          INSERT INTO dead_letter_jobs
            (job_id,reason,attempts,payload)
          VALUES($1,$2,$3,$4)
        `,[
          req.body.jobId,
          "retry_limit_reached",
          Number(req.body.attempt),
          JSON.stringify(req.body.payload||{})
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

app.post("/api/security/risk-approval/create",
async(req,res)=>{
  const result=createApprovalChain({
    requiredLevel:
      Number(req.body?.requiredLevel),
    approvers:req.body?.approvers||[]
  });

  if(result.status==="PENDING"){
    try{
      const chain=await pool.query(`
        INSERT INTO risk_approval_chains
          (risk_acceptance_id,
           required_level,current_level,status)
        VALUES($1,$2,$3,$4)
        RETURNING id
      `,[
        req.body?.riskAcceptanceId||null,
        result.requiredLevel,
        result.currentLevel,
        result.status
      ]);

      for(const step of result.steps){
        await pool.query(`
          INSERT INTO risk_approval_steps
            (chain_id,level,approver,decision)
          VALUES($1,$2,$3,$4)
        `,[
          chain.rows[0].id,
          step.level,
          step.approver,
          step.decision
        ]);
      }
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/risk-approval/decision",
(req,res)=>{
  res.json(applyDecision({
    chain:req.body?.chain,
    level:Number(req.body?.level),
    decision:req.body?.decision
  }));
});

app.post("/api/security/risk-register/calculate",
async(req,res)=>{
  try{
    const result=calculateResidualRisk({
      likelihood:Number(req.body?.likelihood),
      impact:Number(req.body?.impact),
      controlEffectiveness:
        Number(req.body?.controlEffectiveness)
    });

    if(req.body?.title){
      try{
        await pool.query(`
          INSERT INTO executive_risk_register
            (control_id,risk_acceptance_id,
             title,risk_statement,
             likelihood,impact,residual_score,
             owner,status,review_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,[
          req.body?.controlId||null,
          req.body?.riskAcceptanceId||null,
          req.body.title,
          req.body?.riskStatement||
            "Risk under assessment",
          Number(req.body.likelihood),
          Number(req.body.impact),
          result.residualScore,
          req.body?.owner||"unassigned",
          req.body?.status||"OPEN",
          req.body?.reviewAt||null
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

app.get("/api/security/risk-register-dashboard",
async(_req,res)=>{
  try{
    const [open,critical,dlq,locks]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM executive_risk_register
          WHERE status IN ('OPEN','MITIGATING')
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM executive_risk_register
          WHERE status<>'CLOSED'
          AND residual_score>=50
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM dead_letter_jobs
          WHERE status='OPEN'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM worker_locks
          WHERE status='HELD'
          AND expires_at>NOW()
        `)
      ]);

    res.json({
      openExecutiveRisks:
        open.rows[0].count,
      criticalRisks:
        critical.rows[0].count,
      openDeadLetterJobs:
        dlq.rows[0].count,
      activeWorkerLocks:
        locks.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load risk register dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 115 Distributed Risk API running"
));
