const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildEvent,nextStep,requiresApproval}=require("./workflow");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const maxAttempts=Number(process.env.MAX_WORKFLOW_ATTEMPTS||5);

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:35,
  service:"ai-orchestrator"
}));

app.post("/api/workflows/start",async(req,res)=>{
  const {
    workflowName="release-pipeline",
    aggregateType,
    aggregateId,
    payload={}
  }=req.body||{};

  if(!aggregateType||!aggregateId)
    return res.status(400).json({error:"aggregateType and aggregateId are required"});

  const client=await pool.connect();
  try{
    await client.query("BEGIN");

    const run=(await client.query(`
      INSERT INTO workflow_runs
        (workflow_name,aggregate_type,aggregate_id,current_step,status)
      VALUES($1,$2,$3,'SECURITY_SCAN','RUNNING')
      RETURNING *
    `,[workflowName,aggregateType,String(aggregateId)])).rows[0];

    const event=buildEvent(
      "WORKFLOW_STARTED",
      aggregateType,
      aggregateId,
      payload
    );

    await client.query(`
      INSERT INTO workflow_events
        (event_type,aggregate_type,aggregate_id,payload)
      VALUES($1,$2,$3,$4)
    `,[event.eventType,event.aggregateType,event.aggregateId,event.payload]);

    await client.query(`
      INSERT INTO workflow_audit
        (workflow_run_id,step_name,action,result,metadata)
      VALUES($1,'SECURITY_SCAN','WORKFLOW_START','QUEUED',$2)
    `,[run.id,JSON.stringify(payload)]);

    await client.query("COMMIT");
    res.status(201).json({run});
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not start workflow"});
  }finally{
    client.release();
  }
});

app.get("/api/workflows",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM workflow_runs
      ORDER BY created_at DESC LIMIT 100
    `);
    res.json({workflows:rows});
  }catch{
    res.status(500).json({error:"Could not load workflows"});
  }
});

app.get("/api/workflows/:id",async(req,res)=>{
  try{
    const run=(await pool.query(`
      SELECT * FROM workflow_runs WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!run)return res.status(404).json({error:"Workflow not found"});

    const audit=(await pool.query(`
      SELECT * FROM workflow_audit
      WHERE workflow_run_id=$1
      ORDER BY created_at
    `,[run.id])).rows;

    res.json({run,audit});
  }catch{
    res.status(500).json({error:"Could not load workflow"});
  }
});

/*
  Worker reference endpoint. Production workers should consume a real durable
  queue/message broker and use row locks or broker acknowledgements.
*/
app.post("/api/workflows/:id/advance",async(req,res)=>{
  const {result="SUCCESS",metadata={}}=req.body||{};

  const client=await pool.connect();
  try{
    await client.query("BEGIN");

    const run=(await client.query(`
      SELECT * FROM workflow_runs WHERE id=$1 FOR UPDATE
    `,[req.params.id])).rows[0];

    if(!run){
      await client.query("ROLLBACK");
      return res.status(404).json({error:"Workflow not found"});
    }

    if(["COMPLETED","FAILED","CANCELLED"].includes(run.status)){
      await client.query("ROLLBACK");
      return res.status(409).json({error:"Workflow is already closed"});
    }

    if(requiresApproval(run.current_step)){
      await client.query(`
        UPDATE workflow_runs
        SET status='WAITING_APPROVAL'
        WHERE id=$1
      `,[run.id]);

      await client.query(`
        INSERT INTO workflow_audit
          (workflow_run_id,step_name,action,result,metadata)
        VALUES($1,$2,'APPROVAL_GATE','WAITING',$3)
      `,[run.id,run.current_step,JSON.stringify(metadata)]);

      await client.query("COMMIT");
      return res.json({
        status:"WAITING_APPROVAL",
        step:run.current_step,
        message:"Human approval required before this step."
      });
    }

    if(result!=="SUCCESS"){
      await client.query(`
        INSERT INTO workflow_audit
          (workflow_run_id,step_name,action,result,metadata)
        VALUES($1,$2,'STEP','FAILED',$3)
      `,[run.id,run.current_step,JSON.stringify(metadata)]);

      await client.query("COMMIT");
      return res.status(500).json({
        status:"FAILED",
        retryable:true,
        maxAttempts
      });
    }

    const upcoming=nextStep(run.current_step);

    if(!upcoming){
      await client.query(`
        UPDATE workflow_runs
        SET status='COMPLETED',completed_at=NOW()
        WHERE id=$1
      `,[run.id]);
    }else{
      await client.query(`
        UPDATE workflow_runs
        SET current_step=$2,status='RUNNING'
        WHERE id=$1
      `,[run.id,upcoming]);

      await client.query(`
        INSERT INTO workflow_events
          (event_type,aggregate_type,aggregate_id,payload)
        VALUES($1,$2,$3,$4)
      `,[
        `STEP_${upcoming}`,
        run.aggregate_type,
        run.aggregate_id,
        JSON.stringify(metadata)
      ]);
    }

    await client.query(`
      INSERT INTO workflow_audit
        (workflow_run_id,step_name,action,result,metadata)
      VALUES($1,$2,'STEP','SUCCESS',$3)
    `,[run.id,run.current_step,JSON.stringify(metadata)]);

    await client.query("COMMIT");

    res.json({
      status:upcoming?"RUNNING":"COMPLETED",
      nextStep:upcoming||null
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not advance workflow"});
  }finally{
    client.release();
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 35 Orchestrator running"));


module.exports = app;
