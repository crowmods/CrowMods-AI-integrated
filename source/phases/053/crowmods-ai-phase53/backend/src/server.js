const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {listTools}=require("./tools");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:53,
  service:"ai-worker-api"
}));

app.get("/api/worker/tools",(_req,res)=>{
  res.json({tools:listTools()});
});

app.post("/api/worker/jobs",async(req,res)=>{
  const {
    taskId,
    maxAttempts=Number(process.env.MAX_ATTEMPTS||5)
  }=req.body||{};

  if(!taskId)
    return res.status(400).json({error:"taskId is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO worker_jobs(task_id,max_attempts)
      VALUES($1,$2)
      RETURNING *
    `,[taskId,maxAttempts]);

    res.status(201).json({job:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not enqueue worker job"});
  }
});

app.get("/api/worker/jobs",async(req,res)=>{
  const status=req.query.status||null;

  try{
    const {rows}=await pool.query(
      status?`
        SELECT * FROM worker_jobs
        WHERE status=$1
        ORDER BY created_at DESC LIMIT 200
      `:`
        SELECT * FROM worker_jobs
        ORDER BY created_at DESC LIMIT 200
      `,
      status?[status]:[]
    );

    res.json({jobs:rows});
  }catch{
    res.status(500).json({error:"Could not load worker jobs"});
  }
});

app.get("/api/worker/providers",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,provider_name,model_name,enabled,metadata
      FROM model_providers
      ORDER BY provider_name
    `);
    res.json({providers:rows});
  }catch{
    res.status(500).json({error:"Could not load model providers"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 53 Worker API running"));
