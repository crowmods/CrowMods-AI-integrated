const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  nextVersion,
  versionState,
  rollbackTarget
}=require("./versioning");
const {
  approvalState,
  canApprove
}=require("./dual-approval");
const {
  reviewDecision,
  campaignStatus
}=require("./access-review");

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

app.use((req,res,next)=>{
  req.requestId=
    req.header("x-request-id")||
    crypto.randomUUID();

  res.setHeader(
    "x-request-id",
    req.requestId
  );

  next();
});

function identityFromRequest(req){
  /*
   * Trusted identity must be injected by the upstream
   * OIDC verification layer. No client role headers are
   * accepted as authoritative.
   */
  return req.trustedIdentity||null;
}

async function requireGovernanceAdmin(req,res){
  const identity=identityFromRequest(req);

  if(!identity?.authenticated){
    res.status(401).json({
      error:"Trusted identity required"
    });
    return null;
  }

  if(!identity.roles.includes("ops.rbac.admin")){
    res.status(403).json({
      error:"RBAC administrator role required"
    });
    return null;
  }

  return identity;
}

async function audit({
  actor,
  operation,
  resourceType,
  resourceId=null,
  metadata={}
}){
  try{
    await pool.query(`
      INSERT INTO governance_audit
        (actor,operation,resource_type,
         resource_id,metadata)
      VALUES($1,$2,$3,$4,$5)
    `,[
      actor,
      operation,
      resourceType,
      resourceId,
      JSON.stringify(metadata)
    ]);
  }catch{}
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:96,
  service:"rbac-governance"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/rbac/policies/:id/version",async(req,res)=>{
  const identity=await requireGovernanceAdmin(req,res);
  if(!identity) return;

  const {
    changeReason
  }=req.body||{};

  if(!changeReason)
    return res.status(400).json({
      error:"changeReason is required"
    });

  try{
    const policy=(await pool.query(`
      SELECT *
      FROM authorization_policies
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!policy)
      return res.status(404).json({
        error:"Policy not found"
      });

    const versions=(await pool.query(`
      SELECT version_number
      FROM authorization_policy_versions
      WHERE policy_id=$1
    `,[policy.id])).rows;

    const version=nextVersion(versions);

    const state=versionState(policy);

    const {rows}=await pool.query(`
      INSERT INTO authorization_policy_versions
        (policy_id,version_number,
         policy_state,created_by,change_reason)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      policy.id,
      version,
      JSON.stringify(state),
      identity.subject,
      changeReason
    ]);

    await audit({
      actor:identity.subject,
      operation:"CREATE_POLICY_VERSION",
      resourceType:"authorization_policy",
      resourceId:policy.id,
      metadata:{
        version,
        requestId:req.requestId
      }
    });

    res.status(201).json({
      version:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create policy version"
    });
  }
});

app.get("/api/rbac/policies/:id/versions",async(req,res)=>{
  const identity=await requireGovernanceAdmin(req,res);
  if(!identity) return;

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM authorization_policy_versions
      WHERE policy_id=$1
      ORDER BY version_number DESC
    `,[req.params.id]);

    res.json({
      versions:rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load policy versions"
    });
  }
});

app.post("/api/rbac/policies/:id/rollback",async(req,res)=>{
  const identity=await requireGovernanceAdmin(req,res);
  if(!identity) return;

  const {
    versionNumber,
    reason
  }=req.body||{};

  if(versionNumber===undefined||!reason)
    return res.status(400).json({
      error:"versionNumber and reason are required"
    });

  try{
    const versions=(await pool.query(`
      SELECT *
      FROM authorization_policy_versions
      WHERE policy_id=$1
      ORDER BY version_number
    `,[req.params.id])).rows;

    const target=rollbackTarget(
      versions,
      versionNumber
    );

    if(!target)
      return res.status(404).json({
        error:"Version not found"
      });

    const state=target.policy_state;

    const {rows}=await pool.query(`
      UPDATE authorization_policies
      SET resource=$2,
          action=$3,
          required_roles=$4,
          effect=$5,
          enabled=$6,
          priority=$7,
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,
      state.resource,
      state.action,
      JSON.stringify(state.requiredRoles||[]),
      state.effect,
      state.enabled,
      state.priority
    ]);

    await audit({
      actor:identity.subject,
      operation:"ROLLBACK_POLICY",
      resourceType:"authorization_policy",
      resourceId:req.params.id,
      metadata:{
        targetVersion:versionNumber,
        reason,
        requestId:req.requestId
      }
    });

    res.json({
      policy:rows[0],
      rolledBackTo:versionNumber
    });
  }catch{
    res.status(500).json({
      error:"Could not rollback policy"
    });
  }
});

app.post("/api/rbac/change-requests/:id/approve",
async(req,res)=>{
  const identity=await requireGovernanceAdmin(req,res);
  if(!identity) return;

  try{
    const request=(await pool.query(`
      SELECT *
      FROM policy_change_requests
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!request)
      return res.status(404).json({
        error:"Change request not found"
      });

    if(!canApprove({
      subject:identity.subject,
      requester:request.requested_by,
      roles:identity.roles
    }))
      return res.status(403).json({
        error:"Independent approver required"
      });

    const existing=(await pool.query(`
      SELECT approver,decision
      FROM privileged_change_approvals
      WHERE change_request_id=$1
    `,[req.params.id])).rows;

    if(existing.some(
      item=>item.approver===identity.subject
    ))
      return res.status(409).json({
        error:"Approver has already decided"
      });

    const {rows}=await pool.query(`
      INSERT INTO privileged_change_approvals
        (change_request_id,approver,
         approval_type,decision)
      VALUES($1,$2,'SECONDARY','APPROVED')
      RETURNING *
    `,[
      req.params.id,
      identity.subject
    ]);

    const allApprovals=[
      ...existing,
      {
        approver:identity.subject,
        decision:"APPROVED"
      }
    ];

    const state=approvalState(
      allApprovals
    );

    if(state.approved){
      await pool.query(`
        UPDATE policy_change_requests
        SET status='APPROVED',
            approved_by=$2,
            resolved_at=NOW()
        WHERE id=$1
      `,[
        req.params.id,
        identity.subject
      ]);
    }

    await audit({
      actor:identity.subject,
      operation:"PRIVILEGED_CHANGE_APPROVAL",
      resourceType:"policy_change_request",
      resourceId:req.params.id,
      metadata:{
        approvalState:state,
        requestId:req.requestId
      }
    });

    res.json({
      approval:rows[0],
      state
    });
  }catch{
    res.status(500).json({
      error:"Could not record approval"
    });
  }
});

app.post("/api/rbac/access-reviews",async(req,res)=>{
  const identity=await requireGovernanceAdmin(req,res);
  if(!identity) return;

  const {
    campaignName,
    resourceScope,
    reviewerRole,
    dueAt=null
  }=req.body||{};

  if(!campaignName||!resourceScope||!reviewerRole)
    return res.status(400).json({
      error:"campaignName, resourceScope and reviewerRole are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO access_review_campaigns
        (campaign_name,resource_scope,
         reviewer_role,due_at)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      campaignName,
      resourceScope,
      reviewerRole,
      dueAt
    ]);

    await audit({
      actor:identity.subject,
      operation:"CREATE_ACCESS_REVIEW",
      resourceType:"access_review_campaign",
      resourceId:rows[0].id,
      metadata:{
        requestId:req.requestId
      }
    });

    res.status(201).json({
      campaign:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create access review"
    });
  }
});

app.post("/api/rbac/access-reviews/:id/decisions",
async(req,res)=>{
  const identity=await requireGovernanceAdmin(req,res);
  if(!identity) return;

  const {
    subject,
    decision,
    reason
  }=req.body||{};

  const validation=reviewDecision({
    decision,
    reason
  });

  if(!validation.valid)
    return res.status(400).json(validation);

  if(!subject)
    return res.status(400).json({
      error:"subject is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO access_review_decisions
        (campaign_id,subject,reviewer,
         decision,reason)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.id,
      subject,
      identity.subject,
      decision,
      reason
    ]);

    await audit({
      actor:identity.subject,
      operation:"ACCESS_REVIEW_DECISION",
      resourceType:"access_review",
      resourceId:req.params.id,
      metadata:{
        subject,
        decision,
        requestId:req.requestId
      }
    });

    res.status(201).json({
      review:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not record access review"
    });
  }
});

app.get("/api/security/governance",async(_req,res)=>{
  try{
    const [versions,approvals,campaigns,reviews]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM authorization_policy_versions
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM privileged_change_approvals
        WHERE created_at>NOW()-INTERVAL '30 days'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM access_review_campaigns
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM governance_audit
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      policyVersions:versions.rows[0].count,
      approvals30d:approvals.rows[0].count,
      openAccessReviews:campaigns.rows[0].count,
      governanceAudit24h:reviews.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load governance metrics"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 96 Governance API running"
));
