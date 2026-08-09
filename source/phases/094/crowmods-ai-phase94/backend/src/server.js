const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  evaluatePolicies
}=require("./policy");
const {
  claimRoles,
  identityFromValidatedClaims
}=require("./claims");

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

async function loadPolicies(resource,action){
  const {rows}=await pool.query(`
    SELECT id,
           policy_name,
           resource,
           action,
           required_roles,
           effect,
           enabled,
           priority
    FROM authorization_policies
    WHERE resource=$1
      AND action=$2
      AND enabled=true
    ORDER BY priority ASC
  `,[resource,action]);

  return rows.map(row=>({
    id:row.id,
    policyName:row.policy_name,
    resource:row.resource,
    action:row.action,
    requiredRoles:Array.isArray(row.required_roles)
      ?row.required_roles
      :[],
    effect:row.effect,
    enabled:row.enabled,
    priority:row.priority
  }));
}

async function recordDecision({
  identity,
  resource,
  action,
  decision,
  requestId
}){
  try{
    await pool.query(`
      INSERT INTO authorization_decisions
        (subject,resource,action,policy_id,
         allowed,reason,roles,request_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    `,[
      identity?.subject||null,
      resource,
      action,
      decision.policy?.id||null,
      decision.allowed,
      decision.reason,
      JSON.stringify(identity?.roles||[]),
      requestId
    ]);
  }catch{}
}

function developmentAuthenticatedIdentity(req){
  /*
   * Development-only bridge:
   * upstream phase authentication can inject a validated identity
   * through this server-side object. Client role headers are not trusted.
   */
  return req.validatedIdentity||null;
}

async function authenticate(req,res,next){
  /*
   * In production this middleware is expected to be placed after the
   * phase-93/92 verified-token middleware. The current phase keeps the
   * identity boundary explicit rather than accepting client roles.
   */
  const identity=developmentAuthenticatedIdentity(req);

  if(!identity)
    return res.status(401).json({
      error:"Validated identity required"
    });

  req.identity=identity;
  next();
}

function attachDevelopmentIdentity(req,_res,next){
  /*
   * Deterministic local test adapter only.
   * Enable only when DEVELOPMENT_IDENTITY_MODE=true.
   */
  if(
    process.env.DEVELOPMENT_IDENTITY_MODE==="true" &&
    req.header("x-development-subject")
  ){
    const roles=(req.header(
      "x-development-roles"
    )||"")
      .split(",")
      .map(value=>value.trim())
      .filter(Boolean);

    req.validatedIdentity=
      identityFromValidatedClaims({
        payload:{
          sub:req.header(
            "x-development-subject"
          ),
          iss:"development",
          aud:"crowmods"
        },
        roles
      });
  }

  next();
}

async function authorizeRequest({
  req,
  res,
  resource,
  action
}){
  const policies=await loadPolicies(
    resource,
    action
  );

  const decision=evaluatePolicies({
    identity:req.identity,
    resource,
    action,
    policies
  });

  await recordDecision({
    identity:req.identity,
    resource,
    action,
    decision,
    requestId:req.requestId
  });

  if(!decision.allowed){
    return res.status(
      decision.reason==="not_authenticated"
        ?401
        :403
    ).json({
      allowed:false,
      reason:decision.reason
    });
  }

  return null;
}

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

app.use(attachDevelopmentIdentity);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:94,
  service:"policy-rbac"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/rbac/policies",async(req,res)=>{
  const {
    policyName,
    resource,
    action,
    requiredRoles=[],
    effect="ALLOW",
    priority=100
  }=req.body||{};

  if(!policyName||!resource||!action||
     !Array.isArray(requiredRoles))
    return res.status(400).json({
      error:"policyName, resource, action and requiredRoles are required"
    });

  if(!["ALLOW","DENY"].includes(effect))
    return res.status(400).json({
      error:"effect must be ALLOW or DENY"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO authorization_policies
        (policy_name,resource,action,
         required_roles,effect,priority)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      policyName,
      resource,
      action,
      JSON.stringify(requiredRoles),
      effect,
      Number(priority)
    ]);

    res.status(201).json({
      policy:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create authorization policy"
    });
  }
});

app.get("/api/rbac/policies",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM authorization_policies
      ORDER BY resource,action,priority
    `);

    res.json({
      policies:rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load authorization policies"
    });
  }
});

app.patch("/api/rbac/policies/:id",async(req,res)=>{
  const {
    enabled,
    requiredRoles,
    priority
  }=req.body||{};

  if(
    enabled===undefined &&
    requiredRoles===undefined &&
    priority===undefined
  )
    return res.status(400).json({
      error:"No policy fields supplied"
    });

  try{
    const current=(await pool.query(`
      SELECT *
      FROM authorization_policies
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!current)
      return res.status(404).json({
        error:"Policy not found"
      });

    const nextRoles=
      requiredRoles===undefined
        ?current.required_roles
        :requiredRoles;

    const nextEnabled=
      enabled===undefined
        ?current.enabled
        :Boolean(enabled);

    const nextPriority=
      priority===undefined
        ?current.priority
        :Number(priority);

    const {rows}=await pool.query(`
      UPDATE authorization_policies
      SET required_roles=$2,
          enabled=$3,
          priority=$4,
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,
      JSON.stringify(nextRoles),
      nextEnabled,
      nextPriority
    ]);

    res.json({
      policy:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not update authorization policy"
    });
  }
});

app.get("/api/protected/:resource/:action",
  authenticate,
  async(req,res)=>{
    const denied=await authorizeRequest({
      req,
      res,
      resource:req.params.resource,
      action:req.params.action
    });

    if(denied) return;

    res.json({
      allowed:true,
      subject:req.identity.subject,
      roles:req.identity.roles,
      resource:req.params.resource,
      action:req.params.action
    });
  }
);

app.get("/api/security/rbac-operations",async(_req,res)=>{
  try{
    const [policies,decisions,denied]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM authorization_policies
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM authorization_decisions
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM authorization_decisions
        WHERE allowed=false
          AND created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      activePolicies:policies.rows[0].count,
      decisions24h:decisions.rows[0].count,
      denied24h:denied.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load RBAC operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 94 Policy RBAC API running"
));
