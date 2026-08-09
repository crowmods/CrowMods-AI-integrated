const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const crypto=require("crypto");
const {buildPlan}=require("./orchestrator");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

async function enqueue(job){
  const {rows}=await pool.query(`
    INSERT INTO job_queue(job_type,entity_type,entity_id,payload)
    VALUES($1,$2,$3,$4)
    RETURNING id,job_type,status,created_at
  `,[job.jobType,job.entityType,job.entityId,{source:"crow-ai-orchestrator"}]);
  return rows[0];
}

async function audit(action,entityId,metadata={}){
  await pool.query(`
    INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES($1,'RELEASE',$2,$3)
  `,[action,entityId,metadata]);
}

app.get("/health",(_req,res)=>res.json({ok:true,phase:18,mode:process.env.ORCHESTRATOR_MODE||"policy"}));

app.get("/api/orchestrator/:releaseId/plan",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,status,original_name,sha256,size_bytes
      FROM releases WHERE id=$1
    `,[req.params.releaseId]);
    if(!rows[0])return res.status(404).json({error:"Release not found"});
    res.json({plan:buildPlan(rows[0])});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not build plan"});
  }
});

app.post("/api/orchestrator/:releaseId/run",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,status,original_name,sha256,size_bytes
      FROM releases WHERE id=$1
    `,[req.params.releaseId]);
    const release=rows[0];
    if(!release)return res.status(404).json({error:"Release not found"});

    const plan=buildPlan(release);
    const jobs=[];

    for(const job of plan.jobs){
      // Idempotency: avoid duplicate active jobs for the same release/task.
      const existing=await pool.query(`
        SELECT id FROM job_queue
        WHERE job_type=$1 AND entity_id=$2
          AND status IN ('QUEUED','RUNNING')
        LIMIT 1
      `,[job.jobType,release.id]);

      if(existing.rows.length)continue;
      jobs.push(await enqueue(job));
    }

    await audit("ORCHESTRATOR_PLAN_RUN",release.id,{
      jobs:jobs.map(x=>x.job_type),
      requiresHumanApproval:plan.requiresHumanApproval
    });

    res.status(201).json({
      message:"Safe workflow jobs queued.",
      plan,
      queuedJobs:jobs
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Orchestration failed"});
  }
});

app.get("/api/orchestrator/:releaseId/status",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT job_type,status,attempts,last_error,created_at,completed_at
      FROM job_queue
      WHERE entity_id=$1
      ORDER BY created_at ASC
    `,[req.params.releaseId]);
    res.json({releaseId:req.params.releaseId,jobs:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load workflow status"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("Crow AI Orchestrator Phase 18 running"));


module.exports = app;
