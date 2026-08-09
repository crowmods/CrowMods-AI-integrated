const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  MODULES,ROLE_ACCESS,allowed,summarizeHealth
}=require("./control");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:50,
  service:"command-center"
}));

app.get("/api/control/modules",(_req,res)=>{
  res.json({modules:MODULES,roles:ROLE_ACCESS});
});

app.get("/api/control/health",async(_req,res)=>{
  const results={};

  for(const module of MODULES){
    results[module]={status:"healthy"};
  }

  /*
    Replace module defaults with authenticated internal health probes.
    Do not expose database/provider secrets in the response.
  */
  res.json({
    summary:summarizeHealth(results),
    modules:results
  });
});

app.get("/api/control/dashboard",async(_req,res)=>{
  try{
    const [
      releases,
      campaigns,
      support,
      subscriptions,
      tasks
    ]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM release_pages
        WHERE status IN ('REVIEW','APPROVED','PUBLISHED')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM campaigns
        WHERE status IN ('REVIEW','APPROVED','SCHEDULED','RUNNING')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM support_tickets
        WHERE status IN ('OPEN','AI_DRAFTED','ESCALATED')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM subscriptions
        WHERE status IN ('TRIALING','ACTIVE','PAST_DUE')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM ai_tasks
        WHERE status IN ('QUEUED','RUNNING','WAITING_REVIEW')
      `)
    ]);

    res.json({
      releases:releases.rows[0].count,
      campaigns:campaigns.rows[0].count,
      supportTickets:support.rows[0].count,
      activeSubscriptions:subscriptions.rows[0].count,
      pendingAITasks:tasks.rows[0].count
    });
  }catch(err){
    console.error(err);
    res.status(500).json({
      error:"Could not build command-center dashboard",
      hint:"Ensure Phase 41/42/48/49 schemas are installed."
    });
  }
});

app.post("/api/control/ai-tasks",async(req,res)=>{
  const {
    taskType,
    priority="NORMAL",
    inputRef={}
  }=req.body||{};

  if(!taskType)
    return res.status(400).json({error:"taskType is required"});

  if(!["LOW","NORMAL","HIGH","URGENT"].includes(priority))
    return res.status(400).json({error:"Invalid priority"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO ai_tasks(task_type,priority,input_ref)
      VALUES($1,$2,$3)
      RETURNING *
    `,[taskType,priority,inputRef]);

    res.status(201).json({task:rows[0]});
  }catch{
    res.status(500).json({error:"Could not queue AI task"});
  }
});

app.get("/api/control/ai-tasks",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM ai_tasks
      ORDER BY
        CASE priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'NORMAL' THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT 200
    `);

    res.json({tasks:rows});
  }catch{
    res.status(500).json({error:"Could not load AI tasks"});
  }
});

app.post("/api/control/audit",async(req,res)=>{
  const {
    adminUserId=null,
    action,
    resourceType=null,
    resourceId=null,
    metadata={}
  }=req.body||{};

  if(!action)
    return res.status(400).json({error:"action is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO admin_audit_events
        (admin_user_id,action,resource_type,resource_id,metadata)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      adminUserId,action,resourceType,resourceId,metadata
    ]);

    res.status(201).json({event:rows[0]});
  }catch{
    res.status(500).json({error:"Could not write audit event"});
  }
});

/*
  Customer-facing profile endpoint placeholder.
  Production must authenticate the customer and derive customerId from the
  verified session, never from an arbitrary browser-supplied ID.
*/
app.get("/api/customer/portal-preview",(_req,res)=>{
  res.json({
    authenticationRequired:true,
    sections:[
      "profile",
      "subscription",
      "entitlements",
      "invoices",
      "support",
      "notifications"
    ]
  });
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 50 Command Center running"));


module.exports = app;
