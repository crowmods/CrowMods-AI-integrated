const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  evaluateControl,
  summarize,
  evidenceHash
}=require("./assurance");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"
    ?{rejectUnauthorized:true}
    :false
});

const RELEASE_VERSION=
  process.env.RELEASE_VERSION||
  "1.1.0";

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:101,
  release:RELEASE_VERSION
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/assurance/check",
async(req,res)=>{
  const {
    controlId,
    expectedState={},
    observedState={},
    enabled=true
  }=req.body||{};

  const result=evaluateControl({
    expectedState,
    observedState,
    enabled
  });

  const hash=evidenceHash({
    controlId,
    expectedState,
    observedState,
    result
  });

  try{
    await pool.query(`
      INSERT INTO assurance_checks
        (control_id,observed_state,
         status,evidence_hash)
      VALUES($1,$2,$3,$4)
    `,[
      controlId||null,
      JSON.stringify(observedState),
      result.status,
      hash
    ]);
  }catch{}

  res.json({
    ...result,
    evidenceHash:hash
  });
});

app.post("/api/security/remediation",
async(req,res)=>{
  const {
    controlId,
    title,
    severity,
    owner,
    dueAt=null
  }=req.body||{};

  if(!title||!severity||!owner)
    return res.status(400).json({
      error:"title, severity and owner are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO remediation_items
        (control_id,title,severity,
         owner,due_at)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      controlId||null,
      title,
      severity,
      owner,
      dueAt
    ]);

    res.status(201).json({
      remediation:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create remediation"
    });
  }
});

app.get("/api/security/assurance-dashboard",
async(_req,res)=>{
  try{
    const [checks,drift,remediation,runs]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM assurance_checks
          WHERE status='PASS'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM assurance_checks
          WHERE status='DRIFT'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM remediation_items
          WHERE status IN ('OPEN','IN_PROGRESS')
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM assurance_runs
          WHERE created_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      passedChecks:checks.rows[0].count,
      driftedChecks:drift.rows[0].count,
      activeRemediation:remediation.rows[0].count,
      assuranceRuns30d:runs.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load assurance dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 101 Continuous Assurance API running"
));


module.exports = app;
