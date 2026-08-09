const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  burnRate,
  multiWindowBreach,
  sloStatus
}=require("./slo");
const {
  permissions,
  requirePermission
}=require("./rbac");
const {
  timelineEvent
}=require("./timeline");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

async function audit({
  operator,
  action,
  resourceType,
  resourceId=null,
  allowed,
  reason=null,
  metadata={}
}){
  await pool.query(`
    INSERT INTO operational_audit
      (operator_name,action,resource_type,
       resource_id,allowed,reason,metadata)
    VALUES($1,$2,$3,$4,$5,$6,$7)
  `,[
    operator,
    action,
    resourceType,
    resourceId,
    allowed,
    reason,
    JSON.stringify(metadata)
  ]);
}

async function getPermissions(operator){
  const {rows}=await pool.query(`
    SELECT r.permissions
    FROM operator_accounts o
    JOIN operational_roles r
      ON r.id=o.role_id
    WHERE o.operator_name=$1
      AND o.enabled=true
  `,[operator]);

  return rows[0]?.permissions||[];
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:88,
  service:"slo-operations"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/slo/policies",async(req,res)=>{
  const {
    policyName,
    serviceName,
    targetAvailability,
    windowMinutes=60
  }=req.body||{};

  if(!policyName||
     !serviceName||
     targetAvailability===undefined)
    return res.status(400).json({
      error:"policyName, serviceName and targetAvailability are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO slo_policies
        (policy_name,service_name,
         target_availability,window_minutes)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      policyName,
      serviceName,
      Number(targetAvailability),
      Number(windowMinutes)
    ]);

    res.status(201).json({policy:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create SLO policy"
    });
  }
});

app.post("/api/slo/observe",async(req,res)=>{
  const {
    policyId,
    goodEvents,
    totalEvents
  }=req.body||{};

  if(!policyId||
     goodEvents===undefined||
     totalEvents===undefined)
    return res.status(400).json({
      error:"policyId, goodEvents and totalEvents are required"
    });

  try{
    const policy=(await pool.query(`
      SELECT *
      FROM slo_policies
      WHERE id=$1
    `,[policyId])).rows[0];

    if(!policy)
      return res.status(404).json({
        error:"SLO policy not found"
      });

    const rate=burnRate({
      targetAvailability:policy.target_availability,
      goodEvents,
      totalEvents
    });

    const {rows}=await pool.query(`
      INSERT INTO slo_observations
        (policy_id,good_events,total_events)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      policyId,
      Number(goodEvents),
      Number(totalEvents)
    ]);

    res.status(201).json({
      observation:rows[0],
      burnRate:rate,
      status:sloStatus({
        fastBurn:rate,
        slowBurn:rate
      })
    });
  }catch{
    res.status(500).json({
      error:"Could not record SLO observation"
    });
  }
});

app.post("/api/slo/evaluate",async(req,res)=>{
  const {
    fastGood,
    fastTotal,
    slowGood,
    slowTotal,
    targetAvailability
  }=req.body||{};

  if(fastGood===undefined||
     fastTotal===undefined||
     slowGood===undefined||
     slowTotal===undefined||
     targetAvailability===undefined)
    return res.status(400).json({
      error:"All SLO evaluation inputs are required"
    });

  const fastBurn=burnRate({
    targetAvailability,
    goodEvents:fastGood,
    totalEvents:fastTotal
  });

  const slowBurn=burnRate({
    targetAvailability,
    goodEvents:slowGood,
    totalEvents:slowTotal
  });

  res.json({
    fastBurn,
    slowBurn,
    breach:multiWindowBreach({
      fastBurn,
      slowBurn
    }),
    status:sloStatus({
      fastBurn,
      slowBurn
    })
  });
});

app.post("/api/incidents/:id/timeline",async(req,res)=>{
  const {
    eventType,
    actor,
    description,
    metadata={}
  }=req.body||{};

  if(!eventType||!actor||!description)
    return res.status(400).json({
      error:"eventType, actor and description are required"
    });

  const event=timelineEvent({
    eventType,
    actor,
    description,
    metadata
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_timeline
        (incident_id,event_type,actor,
         description,metadata)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.id,
      eventType,
      actor,
      description,
      JSON.stringify(metadata)
    ]);

    res.status(201).json({
      event:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not add timeline event"
    });
  }
});

app.get("/api/incidents/:id/timeline",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM incident_timeline
      WHERE incident_id=$1
      ORDER BY created_at ASC
    `,[req.params.id]);

    res.json({timeline:rows});
  }catch{
    res.status(500).json({
      error:"Could not load incident timeline"
    });
  }
});

app.post("/api/rbac/roles",async(req,res)=>{
  const {
    roleName,
    permissions:rolePermissions=[]
  }=req.body||{};

  if(!roleName||!Array.isArray(rolePermissions))
    return res.status(400).json({
      error:"roleName and permissions are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO operational_roles
        (role_name,permissions)
      VALUES($1,$2)
      RETURNING *
    `,[
      roleName,
      JSON.stringify(rolePermissions)
    ]);

    res.status(201).json({role:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create role"
    });
  }
});

app.post("/api/rbac/operators",async(req,res)=>{
  const {
    operatorName,
    roleId
  }=req.body||{};

  if(!operatorName||!roleId)
    return res.status(400).json({
      error:"operatorName and roleId are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO operator_accounts
        (operator_name,role_id)
      VALUES($1,$2)
      RETURNING *
    `,[
      operatorName,
      roleId
    ]);

    res.status(201).json({operator:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create operator"
    });
  }
});

app.post("/api/operators/:operator/incidents/:incidentId/action",
async(req,res)=>{
  const {
    action
  }=req.body||{};

  const actionPermission={
    acknowledge:permissions.ACK,
    resolve:permissions.RESOLVE,
    escalate:permissions.ESCALATE
  }[action];

  if(!actionPermission)
    return res.status(400).json({
      error:"Unsupported incident action"
    });

  try{
    const assigned=await getPermissions(
      req.params.operator
    );

    const decision=requirePermission(
      assigned,
      actionPermission
    );

    await audit({
      operator:req.params.operator,
      action,
      resourceType:"incident",
      resourceId:req.params.incidentId,
      allowed:decision.allowed,
      reason:decision.allowed
        ?null
        :"permission denied"
    });

    if(!decision.allowed)
      return res.status(403).json({
        error:"Permission denied",
        required:decision.required
      });

    let status="OPEN";

    if(action==="acknowledge")
      status="ACKNOWLEDGED";

    if(action==="resolve")
      status="RESOLVED";

    const {rows}=await pool.query(`
      UPDATE incidents
      SET status=$2,
          updated_at=NOW(),
          resolved_at=CASE
            WHEN $2='RESOLVED' THEN NOW()
            ELSE resolved_at
          END
      WHERE id=$1
      RETURNING *
    `,[
      req.params.incidentId,
      status
    ]);

    res.json({
      incident:rows[0]||null,
      action,
      allowed:true
    });
  }catch{
    res.status(500).json({
      error:"Could not perform incident action"
    });
  }
});

app.get("/api/operations/command-center",async(_req,res)=>{
  try{
    const [incidents,slo,operators,auditRows]=await Promise.all([
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM incidents
        GROUP BY status
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM slo_policies
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM operator_accounts
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM operational_audit
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      incidents:incidents.rows,
      activeSloPolicies:slo.rows[0].count,
      activeOperators:operators.rows[0].count,
      auditEvents24h:auditRows.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load command center"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 88 SLO/RBAC API running"
));


module.exports = app;
