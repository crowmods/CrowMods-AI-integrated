const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {evaluateReadiness}=require("./readiness");

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
  phase:59,
  service:"release-evidence"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/releases/evidence",async(req,res)=>{
  const {
    releaseVersion,
    commitSha,
    environment="staging",
    evidence={}
  }=req.body||{};

  if(!releaseVersion||!commitSha)
    return res.status(400).json({
      error:"releaseVersion and commitSha are required"
    });

  const readiness=evaluateReadiness(evidence);

  try{
    const id=crypto.randomUUID();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS release_evidence (
        id UUID PRIMARY KEY,
        release_version TEXT NOT NULL,
        commit_sha TEXT NOT NULL,
        environment TEXT NOT NULL,
        ready BOOLEAN NOT NULL,
        evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      INSERT INTO release_evidence
        (id,release_version,commit_sha,environment,ready,evidence)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      id,
      releaseVersion,
      commitSha,
      environment,
      readiness.ready,
      {
        ...evidence,
        readiness
      }
    ]);

    res.status(201).json({
      id,
      releaseVersion,
      commitSha,
      environment,
      ...readiness
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not store release evidence"});
  }
});

app.get("/api/releases/evidence",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM release_evidence
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({evidence:rows});
  }catch{
    res.status(500).json({error:"Could not load release evidence"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 59 Release Evidence API running"
));


module.exports = app;
