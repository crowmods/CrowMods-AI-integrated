const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  effectiveRoles
}=require("./roles");
const {
  hasScopedPermission
}=require("./scopes");
const {
  simulateAuthorization
}=require("./simulator");
const {
  validateChangeRequest,
  canApprove
}=require("./change-request");

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

async function identityRequired(req,res){
  const identity=req.identity||null;

  if(!identity?.authenticated){
    res.status(401).json({
      error:"Authenticated trusted identity required"
    });
    return null;
  }

  return identity;
}

async function loadRoleMap(){
  const {rows}=await pool.query(`
    SELECT role_name,parent_role
    FROM rbac_roles
    WHERE enabled=true
  `);

  const map={};

  for(const row of rows){
    map[row.role_name]={
      parentRole:row.parent_role
    };
  }

  return map;
}

async function loadRoleScopes(){
  const {rows}=await pool.query(`
    SELECT r.role_name,
           s.resource,
           s.action,
           s.enabled
    FROM rbac_role_scopes rs
    JOIN rbac_roles r
      ON r.id=rs.role_id
    JOIN rbac_scopes s
      ON s.id=rs.scope_id
    WHERE r.enabled=true
      AND s.enabled=true
  `);

  return rows.map(row=>({
    role:row.role_name,
    resource:row.resource,
    action:row.action,
    enabled:row.enabled
  }));
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:95,
  service:"rbac-controls"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/rbac/roles",async(req,res)=>{
  const identity=await identityRequired(req,res);
  if(!identity) return;

  if(!identity.roles.includes("ops.rbac.admin"))
    return res.status(403).json({
      error:"RBAC administrator role required"
    });

  const {
    roleName,
    parentRole=null,
    description=""
  }=req.body||{};

  if(!roleName)
    return res.status(400).json({
      error:"roleName is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO rbac_roles
        (role_name,parent_role,description)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      roleName,
      parentRole,
      description
    ]);

    res.status(201).json({
      role:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create role"
    });
  }
});

app.post("/api/rbac/scopes",async(req,res)=>{
  const identity=await identityRequired(req,res);
  if(!identity) return;

  if(!identity.roles.includes("ops.rbac.admin"))
    return res.status(403).json({
      error:"RBAC administrator role required"
    });

  const {
    scopeName,
    resource,
    action,
    description=""
  }=req.body||{};

  if(!scopeName||!resource||!action)
    return res.status(400).json({
      error:"scopeName, resource and action are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO rbac_scopes
        (scope_name,resource,action,description)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      scopeName,
      resource,
      action,
      description
    ]);

    res.status(201).json({
      scope:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create scope"
    });
  }
});

app.post("/api/rbac/role-scopes",async(req,res)=>{
  const identity=await identityRequired(req,res);
  if(!identity) return;

  if(!identity.roles.includes("ops.rbac.admin"))
    return res.status(403).json({
      error:"RBAC administrator role required"
    });

  const {
    roleId,
    scopeId
  }=req.body||{};

  if(!roleId||!scopeId)
    return res.status(400).json({
      error:"roleId and scopeId are required"
    });

  try{
    await pool.query(`
      INSERT INTO rbac_role_scopes
        (role_id,scope_id)
      VALUES($1,$2)
      ON CONFLICT DO NOTHING
    `,[
      roleId,
      scopeId
    ]);

    res.status(201).json({
      linked:true
    });
  }catch{
    res.status(500).json({
      error:"Could not link role and scope"
    });
  }
});

app.post("/api/rbac/simulate",async(req,res)=>{
  const identity=await identityRequired(req,res);
  if(!identity) return;

  const {
    resource,
    action
  }=req.body||{};

  if(!resource||!action)
    return res.status(400).json({
      error:"resource and action are required"
    });

  try{
    const [policies,roleMap]=await Promise.all([
      pool.query(`
        SELECT id,policy_name,
               resource,action,
               required_roles,effect,
               enabled,priority
        FROM authorization_policies
        WHERE resource=$1
          AND action=$2
        ORDER BY priority ASC
      `,[resource,action]),
      loadRoleMap()
    ]);

    const normalized=policies.rows.map(row=>({
      id:row.id,
      policyName:row.policy_name,
      resource:row.resource,
      action:row.action,
      requiredRoles:row.required_roles,
      effect:row.effect,
      enabled:row.enabled,
      priority:row.priority
    }));

    res.json(
      simulateAuthorization({
        identity,
        resource,
        action,
        policies:normalized,
        roleMap
      })
    );
  }catch{
    res.status(500).json({
      error:"Could not simulate authorization"
    });
  }
});

app.post("/api/rbac/change-requests",async(req,res)=>{
  const identity=await identityRequired(req,res);
  if(!identity) return;

  const {
    policyId=null,
    changeType,
    proposedChange
  }=req.body||{};

  const validation=validateChangeRequest({
    requestedBy:identity.subject,
    changeType,
    proposedChange
  });

  if(!validation.valid)
    return res.status(400).json(validation);

  try{
    const {rows}=await pool.query(`
      INSERT INTO policy_change_requests
        (policy_id,requested_by,
         change_type,proposed_change)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      policyId,
      identity.subject,
      changeType,
      JSON.stringify(proposedChange)
    ]);

    await pool.query(`
      INSERT INTO rbac_change_audit
        (actor,operation,resource_type,
         resource_id,after_state,request_id)
      VALUES($1,'CREATE_CHANGE_REQUEST',
             'policy_change_request',
             $2,$3,$4)
    `,[
      identity.subject,
      rows[0].id,
      JSON.stringify(rows[0]),
      req.requestId
    ]);

    res.status(201).json({
      request:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create change request"
    });
  }
});

app.post("/api/rbac/change-requests/:id/approve",
async(req,res)=>{
  const identity=await identityRequired(req,res);
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
      identity,
      requestedBy:request.requested_by
    }))
      return res.status(403).json({
        error:"Independent RBAC approver role required"
      });

    const {rows}=await pool.query(`
      UPDATE policy_change_requests
      SET status='APPROVED',
          approved_by=$2,
          resolved_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,
      identity.subject
    ]);

    await pool.query(`
      INSERT INTO rbac_change_audit
        (actor,operation,resource_type,
         resource_id,before_state,
         after_state,request_id)
      VALUES($1,'APPROVE_CHANGE_REQUEST',
             'policy_change_request',
             $2,$3,$4,$5)
    `,[
      identity.subject,
      req.params.id,
      JSON.stringify(request),
      JSON.stringify(rows[0]),
      req.requestId
    ]);

    res.json({
      request:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not approve change request"
    });
  }
});

app.get("/api/security/rbac-controls",async(_req,res)=>{
  try{
    const [roles,scopes,requests,audits]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM rbac_roles
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM rbac_scopes
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM policy_change_requests
        WHERE status='PENDING'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM rbac_change_audit
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      activeRoles:roles.rows[0].count,
      activeScopes:scopes.rows[0].count,
      pendingChanges:requests.rows[0].count,
      changeAudit24h:audits.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load RBAC controls"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 95 RBAC Controls API running"
));
