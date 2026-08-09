const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {probeJwks}=require("./jwks-probe");
const {inspectCertificate}=require("./cert-probe");
const {
  DevelopmentHealthSigner,
  signHealthEvidence
}=require("./health-signing");
const {
  validatePlan,
  canExecute
}=require("./remediation-plan");

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

const signer=new DevelopmentHealthSigner({
  secret:
    process.env.DEV_HEALTH_SIGNING_SECRET||
    "health-development-secret"
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:103
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/live/jwks",
async(req,res)=>{
  const {url}=req.body||{};

  if(!url)
    return res.status(400).json({
      error:"url is required"
    });

  const result=await probeJwks(url);

  const evidence=signHealthEvidence({
    data:{
      probe:"JWKS",
      target:url,
      result
    },
    signer
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO live_probe_runs
        (probe_type,target,status,
         latency_ms,evidence_hash,details)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING id
    `,[
      "JWKS",
      url,
      result.status,
      result.latencyMs||null,
      evidence.digest,
      JSON.stringify(result)
    ]);

    await pool.query(`
      INSERT INTO health_evidence_signatures
        (probe_run_id,digest,
         signature,key_version,algorithm)
      VALUES($1,$2,$3,$4,$5)
    `,[
      rows[0].id,
      evidence.digest,
      evidence.signature,
      evidence.keyVersion,
      evidence.algorithm
    ]);
  }catch{}

  res.json({
    result,
    evidence
  });
});

app.post("/api/security/live/certificate",
async(req,res)=>{
  const {
    daysRemaining,
    trusted=true
  }=req.body||{};

  const result=inspectCertificate({
    daysRemaining:Number(daysRemaining),
    trusted
  });

  const evidence=signHealthEvidence({
    data:{
      probe:"TLS_CERTIFICATE",
      daysRemaining,
      trusted,
      result
    },
    signer
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO live_probe_runs
        (probe_type,target,status,
         evidence_hash,details)
      VALUES($1,$2,$3,$4,$5)
      RETURNING id
    `,[
      "TLS_CERTIFICATE",
      "configured-target",
      result.status,
      evidence.digest,
      JSON.stringify(result)
    ]);

    await pool.query(`
      INSERT INTO health_evidence_signatures
        (probe_run_id,digest,
         signature,key_version,algorithm)
      VALUES($1,$2,$3,$4,$5)
    `,[
      rows[0].id,
      evidence.digest,
      evidence.signature,
      evidence.keyVersion,
      evidence.algorithm
    ]);
  }catch{}

  res.json({
    result,
    evidence
  });
});

app.post("/api/security/remediation-plans",
async(req,res)=>{
  const {
    controlKey,
    action,
    reason,
    riskLevel="HIGH",
    requestedBy
  }=req.body||{};

  const validation=validatePlan({
    controlKey,
    action,
    reason,
    requestedBy
  });

  if(!validation.valid)
    return res.status(400).json(validation);

  try{
    const {rows}=await pool.query(`
      INSERT INTO remediation_plans
        (control_key,action,reason,
         risk_level,requested_by)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      controlKey,
      action,
      reason,
      riskLevel,
      requestedBy
    ]);

    res.status(201).json({
      plan:rows[0],
      requiresIndependentApproval:
        ["HIGH","CRITICAL"].includes(
          riskLevel
        )
    });
  }catch{
    res.status(500).json({
      error:"Could not create remediation plan"
    });
  }
});

app.post("/api/security/remediation-plans/:id/approve",
async(req,res)=>{
  const {
    approvedBy
  }=req.body||{};

  if(!approvedBy)
    return res.status(400).json({
      error:"approvedBy is required"
    });

  try{
    const plan=(await pool.query(`
      SELECT *
      FROM remediation_plans
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!plan)
      return res.status(404).json({
        error:"Remediation plan not found"
      });

    if(plan.requested_by===approvedBy)
      return res.status(403).json({
        error:"Independent approver required"
      });

    await pool.query(`
      UPDATE remediation_plans
      SET status='APPROVED',
          approved_by=$2,
          updated_at=NOW()
      WHERE id=$1
    `,[
      req.params.id,
      approvedBy
    ]);

    res.json({
      approved:true,
      planId:req.params.id
    });
  }catch{
    res.status(500).json({
      error:"Could not approve remediation"
    });
  }
});

app.post("/api/security/remediation-plans/:id/execute",
async(req,res)=>{
  const {executor}=req.body||{};

  if(!executor)
    return res.status(400).json({
      error:"executor is required"
    });

  try{
    const plan=(await pool.query(`
      SELECT *
      FROM remediation_plans
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!plan)
      return res.status(404).json({
        error:"Remediation plan not found"
      });

    if(!canExecute({
      status:plan.status,
      requestedBy:plan.requested_by,
      approvedBy:plan.approved_by,
      riskLevel:plan.risk_level
    }))
      return res.status(403).json({
        error:"Approval gate not satisfied"
      });

    /*
     * Intentionally does not mutate external infrastructure.
     * Production should route the allowlisted action through a
     * narrowly scoped remediation adapter.
     */
    await pool.query(`
      UPDATE remediation_plans
      SET status='EXECUTED',
          updated_at=NOW()
      WHERE id=$1
    `,[req.params.id]);

    res.json({
      executed:true,
      mode:"CONTROLLED_ADAPTER_REQUIRED",
      planId:req.params.id,
      executor
    });
  }catch{
    res.status(500).json({
      error:"Could not execute remediation"
    });
  }
});

app.get("/api/security/live-health-dashboard",
async(_req,res)=>{
  try{
    const [passes,fails,plans,evidence]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM live_probe_runs
          WHERE status='PASS'
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM live_probe_runs
          WHERE status IN ('FAIL','BLOCKED')
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM remediation_plans
          WHERE status IN ('PROPOSED','APPROVED')
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM health_evidence_signatures
          WHERE created_at>NOW()-INTERVAL '24 hours'
        `)
      ]);

    res.json({
      passes24h:passes.rows[0].count,
      failures24h:fails.rows[0].count,
      pendingRemediation:plans.rows[0].count,
      signedEvidence24h:evidence.rows[0].count,
      signer:{
        mode:"SIMULATION",
        keyVersion:signer.keyVersion,
        algorithm:signer.algorithm
      }
    });
  }catch{
    res.status(500).json({
      error:"Could not load live health dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 103 Live Health API running"
));
