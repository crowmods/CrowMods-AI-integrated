const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {STAGES,evaluateStage,nextStage}=require("./progressive");

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
  phase:58,
  service:"progressive-release"
}));

app.get("/api/releases/stages",(_req,res)=>{
  res.json({stages:STAGES});
});

app.post("/api/releases/evaluate",async(req,res)=>{
  const {
    releaseId,
    currentStage="CANARY",
    errorRate,
    latencyMs,
    healthPassRate
  }=req.body||{};

  if(!releaseId ||
     !Number.isFinite(Number(errorRate)) ||
     !Number.isFinite(Number(latencyMs)) ||
     !Number.isFinite(Number(healthPassRate))){
    return res.status(400).json({
      error:"releaseId and numeric rollout metrics are required"
    });
  }

  const result=evaluateStage({
    errorRate:Number(errorRate),
    latencyMs:Number(latencyMs),
    healthPassRate:Number(healthPassRate)
  });

  const next=result.promote?nextStage(currentStage):null;

  try{
    await pool.query(`
      INSERT INTO deployment_checks
        (release_id,check_name,passed,observed_value,threshold,message)
      VALUES
        ($1,'progressive.error_rate',$2,$3,$4,$5),
        ($1,'progressive.latency_ms',$6,$7,$8,$9),
        ($1,'progressive.health_pass_rate',$10,$11,$12,$13)
    `,[
      releaseId,
      result.checks.errorRate,
      result.observed.errorRate,
      result.thresholds.maxErrorRate,
      result.checks.errorRate?"PASS":"FAIL",
      result.checks.latencyMs,
      result.observed.latencyMs,
      result.thresholds.maxLatencyMs,
      result.checks.latencyMs?"PASS":"FAIL",
      result.checks.healthPassRate,
      result.observed.healthPassRate,
      result.thresholds.minHealthPassRate,
      result.checks.healthPassRate?"PASS":"FAIL"
    ]);

    res.json({
      releaseId,
      currentStage,
      decision:result.promote
        ?(next?`PROMOTE_TO_${next.name}`:"PROMOTED")
        :"ROLLBACK",
      trafficTarget:next?.trafficPercent||(
        result.promote && currentStage==="FULL"?100:0
      ),
      checks:result.checks
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record rollout evaluation"});
  }
});

app.get("/api/releases/dashboard",async(_req,res)=>{
  try{
    const releases=(await pool.query(`
      SELECT id,release_version,commit_sha,
             api_image_digest,worker_image_digest,
             frontend_image_digest,status,created_at,
             promoted_at,rolled_back_at
      FROM release_manifests
      ORDER BY created_at DESC
      LIMIT 50
    `)).rows;

    res.json({
      stages:STAGES,
      releases
    });
  }catch{
    res.status(500).json({error:"Could not load release dashboard"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 58 Progressive Release API running"
));


module.exports = app;
