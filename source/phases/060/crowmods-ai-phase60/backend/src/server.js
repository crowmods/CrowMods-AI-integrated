const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  ROLLOUT_STAGES,
  launchReady,
  nextStage,
  rolloutDecision
}=require("./launch");

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
  phase:60,
  service:"production-launch"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/launch/stages",(_req,res)=>{
  res.json({stages:ROLLOUT_STAGES});
});

app.post("/api/launch/readiness",(_req,res)=>{
  res.json(launchReady(_req.body?.evidence||{}));
});

app.post("/api/launch/rollout",(_req,res)=>{
  const {
    currentStage="CANARY",
    metrics={}
  }=_req.body||{};

  const decision=rolloutDecision(metrics);
  const next=decision.promote?nextStage(currentStage):null;

  res.json({
    currentStage,
    decision:decision.promote
      ?(next?`PROMOTE_TO_${next.name}`:"COMPLETE")
      :"ROLLBACK",
    nextTrafficPercent:next?.trafficPercent||(
      decision.promote&&currentStage==="FULL"?100:0
    ),
    ...decision
  });
});

app.get("/api/launch/dashboard",async(_req,res)=>{
  try{
    const evidence=await pool.query(`
      SELECT *
      FROM release_evidence
      ORDER BY created_at DESC
      LIMIT 25
    `);

    const releases=await pool.query(`
      SELECT *
      FROM release_manifests
      ORDER BY created_at DESC
      LIMIT 25
    `);

    res.json({
      stages:ROLLOUT_STAGES,
      evidence:evidence.rows,
      releases:releases.rows
    });
  }catch{
    res.status(500).json({
      error:"Launch dashboard requires Phase 57/59 release tables"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 60 Production Launch API running"
));
