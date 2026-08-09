const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:64,
  service:"escalation-worker"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/oncall/escalation-jobs",async(req,res)=>{
  const {
    incidentId,
    maxAttempts=5
  }=req.body||{};

  if(!incidentId)
    return res.status(400).json({error:"incidentId is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO escalation_jobs
        (routed_incident_id,max_attempts)
      VALUES($1,$2)
      RETURNING *
    `,[incidentId,maxAttempts]);

    res.status(201).json({job:rows[0]});
  }catch{
    res.status(500).json({error:"Could not enqueue escalation job"});
  }
});

app.get("/api/oncall/escalation-jobs",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM escalation_jobs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({jobs:rows});
  }catch{
    res.status(500).json({error:"Could not load escalation jobs"});
  }
});

app.get("/api/oncall/incidents/:id/notifications",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM notification_deliveries
      WHERE routed_incident_id=$1
      ORDER BY created_at DESC
    `,[req.params.id]);

    res.json({notifications:rows});
  }catch{
    res.status(500).json({error:"Could not load notifications"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 64 Escalation API running"
));
