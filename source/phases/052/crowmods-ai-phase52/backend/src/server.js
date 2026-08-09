const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  AGENTS,buildPlan
}=require("./orchestrator");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

app.use((req,res,next)=>{
  req.requestId=crypto.randomUUID();
  res.setHeader("X-Request-ID",req.requestId);
  next();
});

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:52,
  service:"ai-orchestrator"
}));

app.get("/api/ai/agents",(_req,res)=>{
  res.json({agents:AGENTS});
});

app.post("/api/ai/workflows",async(req,res)=>{
  const {
    goal,
    createdBy="command-center",
    context={}
  }=req.body||{};

  if(!goal)
    return res.status(400).json({error:"goal is required"});

  const plan=buildPlan(goal);

  if(plan.length>Number(process.env.MAX_WORKFLOW_TASKS||25))
    return res.status(400).json({error:"Workflow exceeds task limit"});

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const workflow=(await client.query(`
      INSERT INTO ai_workflows(goal,status,created_by,context)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      goal,
      plan.some(x=>x.approvalRequired)
        ?"WAITING_APPROVAL":"RUNNING",
      createdBy,
      context
    ])).rows[0];

    for(const task of plan){
      await client.query(`
        INSERT INTO ai_workflow_tasks
          (workflow_id,agent,task_type,required_permission,
           approval_required,sequence_no,input)
        VALUES($1,$2,$3,$4,$5,$6,$7)
      `,[
        workflow.id,
        task.agent,
        task.taskType,
        task.tool,
        task.approvalRequired,
        task.sequenceNo,
        {tool:task.tool,goal}
      ]);
    }

    await client.query(`
      INSERT INTO ai_execution_events
        (workflow_id,event_type,request_id,metadata)
      VALUES($1,'WORKFLOW_CREATED',$2,$3)
    `,[workflow.id,req.requestId,{taskCount:plan.length}]);

    await client.query("COMMIT");

    res.status(201).json({
      workflow,
      plan,
      message:"Plan created. High-impact steps require approval."
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not create workflow"});
  }finally{
    client.release();
  }
});

app.get("/api/ai/workflows",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM ai_workflows
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({workflows:rows});
  }catch{
    res.status(500).json({error:"Could not load workflows"});
  }
});

app.get("/api/ai/workflows/:id",async(req,res)=>{
  try{
    const workflow=(await pool.query(`
      SELECT * FROM ai_workflows WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!workflow)return res.status(404).json({error:"Workflow not found"});

    const tasks=(await pool.query(`
      SELECT * FROM ai_workflow_tasks
      WHERE workflow_id=$1
      ORDER BY sequence_no
    `,[req.params.id])).rows;

    const events=(await pool.query(`
      SELECT * FROM ai_execution_events
      WHERE workflow_id=$1
      ORDER BY created_at
    `,[req.params.id])).rows;

    res.json({workflow,tasks,events});
  }catch{
    res.status(500).json({error:"Could not load workflow"});
  }
});

app.post("/api/ai/tasks/:id/approve",async(req,res)=>{
  const {
    approvedBy
  }=req.body||{};

  if(!approvedBy)
    return res.status(400).json({error:"approvedBy is required"});

  try{
    const {rows}=await pool.query(`
      UPDATE ai_workflow_tasks
      SET approval_required=FALSE,
          approved_by=$2,
          status='QUEUED'
      WHERE id=$1 AND approval_required=TRUE
      RETURNING *
    `,[req.params.id,approvedBy]);

    if(!rows[0])
      return res.status(404).json({
        error:"Approval-required task not found"
      });

    await pool.query(`
      INSERT INTO ai_execution_events
        (task_id,workflow_id,event_type,metadata)
      VALUES($1,$2,'TASK_APPROVED',$3)
    `,[
      rows[0].id,
      rows[0].workflow_id,
      {approvedBy}
    ]);

    res.json({task:rows[0]});
  }catch{
    res.status(500).json({error:"Could not approve task"});
  }
});

app.post("/api/ai/tasks/:id/result",async(req,res)=>{
  const {
    status,
    output={},
    errorMessage=null
  }=req.body||{};

  if(![
    "RUNNING","VERIFYING","COMPLETED",
    "FAILED","CANCELLED"
  ].includes(status))
    return res.status(400).json({error:"Invalid task status"});

  try{
    const {rows}=await pool.query(`
      UPDATE ai_workflow_tasks
      SET status=$2,output=$3,error_message=$4,
          started_at=COALESCE(started_at,CASE
            WHEN $2='RUNNING' THEN NOW() ELSE started_at END),
          completed_at=CASE
            WHEN $2 IN ('COMPLETED','FAILED','CANCELLED') THEN NOW()
            ELSE completed_at END
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,status,output,errorMessage
    ]);

    if(!rows[0])return res.status(404).json({error:"Task not found"});

    await pool.query(`
      INSERT INTO ai_execution_events
        (workflow_id,task_id,event_type,request_id,metadata)
      VALUES($1,$2,$3,$4,$5)
    `,[
      rows[0].workflow_id,
      rows[0].id,
      `TASK_${status}`,
      req.requestId,
      {output,errorMessage}
    ]);

    res.json({task:rows[0]});
  }catch{
    res.status(500).json({error:"Could not record task result"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 52 AI Orchestrator running"));
