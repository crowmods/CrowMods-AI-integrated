const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {evaluateCanary}=require("./canary");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:57,
  service:"release-control"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/releases/manifests",async(req,res)=>{
  const {
    releaseVersion,
    commitSha,
    apiImageDigest,
    workerImageDigest,
    frontendImageDigest=null,
    metadata={}
  }=req.body||{};

  if(!releaseVersion||!commitSha||!apiImageDigest||!workerImageDigest)
    return res.status(400).json({
      error:"releaseVersion, commitSha, apiImageDigest and workerImageDigest are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO release_manifests
        (release_version,commit_sha,api_image_digest,
         worker_image_digest,frontend_image_digest,metadata)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      releaseVersion,commitSha,apiImageDigest,
      workerImageDigest,frontendImageDigest,metadata
    ]);

    res.status(201).json({release:rows[0]});
  }catch{
    res.status(500).json({error:"Could not create release manifest"});
  }
});

app.post("/api/releases/:id/canary-check",async(req,res)=>{
  const result=evaluateCanary(req.body||{});

  try{
    await pool.query(`
      INSERT INTO deployment_checks
        (release_id,check_name,passed,observed_value,threshold,message)
      VALUES
        ($1,'error_rate',$2,$3,$4,$5),
        ($1,'latency_ms',$6,$7,$8,$9),
        ($1,'health_pass_rate',$10,$11,$12,$13)
    `,[
      req.params.id,
      result.checks.errorRate,
      result.observed.errorRate,
      result.thresholds.maxErrorRate,
      result.checks.errorRate?"Within threshold":"Above threshold",
      result.checks.latencyMs,
      result.observed.latencyMs,
      result.thresholds.maxLatencyMs,
      result.checks.latencyMs?"Within threshold":"Above threshold",
      result.checks.healthPassRate,
      result.observed.healthPassRate,
      result.thresholds.minHealthPassRate,
      result.checks.healthPassRate?"Within threshold":"Below threshold"
    ]);

    await pool.query(`
      UPDATE release_manifests
      SET status=$2,
          promoted_at=CASE WHEN $2='PROMOTED' THEN NOW() ELSE promoted_at END,
          rolled_back_at=CASE WHEN $2='ROLLED_BACK' THEN NOW() ELSE rolled_back_at END
      WHERE id=$1
    `,[
      req.params.id,
      result.promote?"PROMOTED":"ROLLED_BACK"
    ]);

    res.json(result);
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record canary check"});
  }
});

app.get("/api/releases",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM release_manifests
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({releases:rows});
  }catch{
    res.status(500).json({error:"Could not load release manifests"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 57 Release Control running"));
