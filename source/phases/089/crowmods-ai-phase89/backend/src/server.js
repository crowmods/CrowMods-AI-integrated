const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  buildIdentity,
  requireAuthenticated
}=require("./identity");
const {
  eventHash,
  verifyChain
}=require("./audit");
const {
  evaluateRule,
  alertSeverity
}=require("./slo-alerts");

const app=express();
app.use(helmet());
app.use(cors());
app.use((req,res,next)=>{
  const requestId=req.header("x-request-id")||
    crypto.randomUUID();

  req.requestId=requestId;
  res.setHeader("x-request-id",requestId);
  next();
});
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

async function appendAudit({
  actor,
  action,
  resourceType,
  resourceId=null,
  allowed,
  metadata={}
}){
  const previous=(await pool.query(`
    SELECT event_hash
    FROM immutable_audit_log
    ORDER BY id DESC
    LIMIT 1
  `)).rows[0]?.event_hash||null;

  const eventHashValue=eventHash({
    actor,
    action,
    resourceType,
    resourceId,
    allowed,
    metadata
  },previous);

  const {rows}=await pool.query(`
    INSERT INTO immutable_audit_log
      (actor,action,resource_type,resource_id,
       allowed,metadata,previous_hash,event_hash)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `,[
    actor,
    action,
    resourceType,
    resourceId,
    Boolean(allowed),
    JSON.stringify(metadata),
    previous,
    eventHashValue
  ]);

  return rows[0];
}

function identityFromRequest(req){
  const subject=req.header("x-auth-subject");
  const provider=req.header("x-auth-provider")||"trusted-idp";
  const rawRoles=req.header("x-auth-roles")||"";
  const roles=rawRoles
    .split(",")
    .map(v=>v.trim())
    .filter(Boolean);

  if(!subject) return null;

  return buildIdentity({
    subject,
    provider,
    roles
  });
}

async function requireIdentity(req,res){
  const identity=identityFromRequest(req);

  if(!requireAuthenticated(identity)){
    await appendAudit({
      actor:identity?.subject||"anonymous",
      action:"authenticated-request",
      resourceType:"api",
      resourceId:req.path,
      allowed:false,
      metadata:{
        requestId:req.requestId
      }
    });

    res.status(401).json({
      error:"Authenticated identity required",
      requestId:req.requestId
    });

    return null;
  }

  return identity;
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:89,
  service:"security-audit"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/security/me",async(req,res)=>{
  const identity=await requireIdentity(req,res);
  if(!identity) return;

  await appendAudit({
    actor:identity.subject,
    action:"identity.view",
    resourceType:"identity",
    resourceId:identity.subject,
    allowed:true,
    metadata:{
      provider:identity.provider,
      roles:identity.roles,
      requestId:req.requestId
    }
  });

  res.json({
    identity
  });
});

app.post("/api/slo/alert-rules",async(req,res)=>{
  const identity=await requireIdentity(req,res);
  if(!identity) return;

  const {
    ruleName,
    serviceName,
    fastBurnThreshold,
    slowBurnThreshold,
    severity="WARNING"
  }=req.body||{};

  if(!ruleName||
     !serviceName||
     fastBurnThreshold===undefined||
     slowBurnThreshold===undefined)
    return res.status(400).json({
      error:"ruleName, serviceName and burn thresholds are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO slo_alert_rules
        (rule_name,service_name,
         fast_burn_threshold,slow_burn_threshold,severity)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      ruleName,
      serviceName,
      Number(fastBurnThreshold),
      Number(slowBurnThreshold),
      severity
    ]);

    await appendAudit({
      actor:identity.subject,
      action:"slo.alert_rule.create",
      resourceType:"slo_alert_rule",
      resourceId:rows[0].id,
      allowed:true,
      metadata:{
        requestId:req.requestId
      }
    });

    res.status(201).json({
      rule:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create SLO alert rule"
    });
  }
});

app.post("/api/slo/alert-rules/:id/evaluate",async(req,res)=>{
  const identity=await requireIdentity(req,res);
  if(!identity) return;

  const {
    fastBurn,
    slowBurn
  }=req.body||{};

  if(fastBurn===undefined||slowBurn===undefined)
    return res.status(400).json({
      error:"fastBurn and slowBurn are required"
    });

  try{
    const rule=(await pool.query(`
      SELECT *
      FROM slo_alert_rules
      WHERE id=$1 AND enabled=true
    `,[req.params.id])).rows[0];

    if(!rule)
      return res.status(404).json({
        error:"SLO alert rule not found"
      });

    const evaluation=evaluateRule({
      fastBurn,
      slowBurn,
      fastThreshold:rule.fast_burn_threshold,
      slowThreshold:rule.slow_burn_threshold
    });

    const severity=alertSeverity({
      ...evaluation,
      configuredSeverity:rule.severity
    });

    let alert=null;

    if(evaluation.breached){
      alert=(await pool.query(`
        INSERT INTO slo_alert_events
          (rule_id,service_name,fast_burn,
           slow_burn,severity)
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
      `,[
        rule.id,
        rule.service_name,
        Number(fastBurn),
        Number(slowBurn),
        severity
      ])).rows[0];
    }

    await appendAudit({
      actor:identity.subject,
      action:"slo.alert.evaluate",
      resourceType:"slo_alert_rule",
      resourceId:rule.id,
      allowed:true,
      metadata:{
        requestId:req.requestId,
        evaluation,
        severity
      }
    });

    res.json({
      evaluation,
      severity,
      alert
    });
  }catch{
    res.status(500).json({
      error:"Could not evaluate SLO alert rule"
    });
  }
});

app.get("/api/security/audit/verify",async(req,res)=>{
  const identity=await requireIdentity(req,res);
  if(!identity) return;

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM immutable_audit_log
      ORDER BY id ASC
      LIMIT 10000
    `);

    const result=verifyChain(rows);

    await appendAudit({
      actor:identity.subject,
      action:"audit.verify",
      resourceType:"immutable_audit_log",
      allowed:true,
      metadata:{
        requestId:req.requestId,
        verification:result
      }
    });

    res.json(result);
  }catch{
    res.status(500).json({
      error:"Could not verify audit chain"
    });
  }
});

app.get("/api/security/audit",async(req,res)=>{
  const identity=await requireIdentity(req,res);
  if(!identity) return;

  try{
    const {rows}=await pool.query(`
      SELECT id,event_id,actor,action,
             resource_type,resource_id,
             allowed,metadata,
             previous_hash,event_hash,created_at
      FROM immutable_audit_log
      ORDER BY id DESC
      LIMIT 200
    `);

    res.json({
      actor:identity.subject,
      events:rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load audit events"
    });
  }
});

app.get("/api/security/operations",async(req,res)=>{
  const identity=await requireIdentity(req,res);
  if(!identity) return;

  try{
    const [sessions,rules,alerts,audits]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM identity_sessions
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM slo_alert_rules
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM slo_alert_events
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM immutable_audit_log
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      actor:identity.subject,
      activeSessions:sessions.rows[0].count,
      activeRules:rules.rows[0].count,
      openSloAlerts:alerts.rows[0].count,
      auditEvents24h:audits.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load security operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 89 Security/Audit API running"
));
