const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {enqueue}=require("./queue");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:17}));

app.get("/api/jobs",async(req,res)=>{
  try{
    const limit=Math.min(Number(req.query.limit||50),100);
    const {rows}=await pool.query(`
      SELECT id,job_type,entity_type,entity_id,status,attempts,max_attempts,
             available_at,locked_by,last_error,created_at,completed_at
      FROM job_queue
      ORDER BY created_at DESC LIMIT $1
    `,[limit]);
    res.json({jobs:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load jobs"});
  }
});

app.post("/api/jobs",async(req,res)=>{
  const {jobType,entityType=null,entityId=null,payload={},availableAt=null}=req.body||{};
  if(!jobType)return res.status(400).json({error:"jobType required"});
  try{
    const job=await enqueue(pool,{jobType,entityType,entityId,payload,availableAt});
    res.status(201).json({job});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not enqueue job"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 17 API running"));
