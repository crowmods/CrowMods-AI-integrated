const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  capacityScore,
  chaosResult,
  overallResilience
}=require("./resilience");
const {MemoryChaosProvider}=require("./chaos");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const chaos=new MemoryChaosProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:83,
  service:"resilience-exercises"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/exercises/schedules",async(req,res)=>{
  const {
    exerciseName,
    cadence="weekly",
    environment="simulation",
    nextRunAt=null
  }=req.body||{};

  if(!exerciseName)
    return res.status(400).json({
      error:"exerciseName is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO exercise_schedules
        (exercise_name,cadence,environment,next_run_at)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      exerciseName,
      cadence,
      environment,
      nextRunAt
    ]);

    res.status(201).json({schedule:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create exercise schedule"
    });
  }
});

app.post("/api/chaos/experiments",async(req,res)=>{
  const {
    experimentName,
    faultType,
    targetScope,
    exerciseId=null,
    dryRun=true
  }=req.body||{};

  if(!experimentName||!faultType||!targetScope)
    return res.status(400).json({
      error:"experimentName, faultType and targetScope are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO chaos_experiments
        (exercise_id,experiment_name,fault_type,
         target_scope,dry_run)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      exerciseId,
      experimentName,
      faultType,
      targetScope,
      Boolean(dryRun)
    ]);

    res.status(201).json({experiment:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create chaos experiment"
    });
  }
});

app.post("/api/chaos/experiments/:id/run",async(req,res)=>{
  const {
    scope="simulation"
  }=req.body||{};

  const fault={
    id:req.params.id,
    scope
  };

  try{
    const injected=await chaos.inject(fault);
    const recovered=await chaos.recover(fault);
    const rollback=await chaos.rollback(fault);

    const result=chaosResult({
      injectionSucceeded:injected.injected,
      recoverySucceeded:recovered.recovered,
      rollbackSucceeded:rollback.rolledBack
    });

    const {rows}=await pool.query(`
      UPDATE chaos_experiments
      SET status=$2,started_at=NOW(),completed_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,
      result.passed?"PASSED":"FAILED"
    ]);

    res.json({
      experiment:rows[0],
      result,
      lifecycle:{
        injected,
        recovered,
        rollback
      }
    });
  }catch{
    res.status(500).json({
      error:"Chaos experiment failed"
    });
  }
});

app.post("/api/capacity/score",async(req,res)=>{
  const {
    regionName,
    availability,
    utilization,
    replicationLag,
    recoveryReadiness
  }=req.body||{};

  if(!regionName||
     availability===undefined||
     utilization===undefined||
     replicationLag===undefined||
     recoveryReadiness===undefined)
    return res.status(400).json({
      error:"All capacity metrics are required"
    });

  const result=capacityScore({
    availability,
    utilization,
    replicationLag,
    recoveryReadiness
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO capacity_scores
        (region_name,availability,utilization,
         replication_lag,recovery_readiness,
         score,healthy)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      regionName,
      Number(availability),
      Number(utilization),
      Number(replicationLag),
      Number(recoveryReadiness),
      result.score,
      result.healthy
    ]);

    res.status(201).json({
      sample:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not save capacity score"
    });
  }
});

app.post("/api/resilience/scorecard",async(req,res)=>{
  const {
    exerciseId=null,
    recoveryScore,
    capacityScore:capacity,
    chaosScore,
    report={}
  }=req.body||{};

  if(recoveryScore===undefined||
     capacity===undefined||
     chaosScore===undefined)
    return res.status(400).json({
      error:"recoveryScore, capacityScore and chaosScore are required"
    });

  const result=overallResilience({
    recoveryScore,
    capacityScore:capacity,
    chaosScore
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO resilience_scorecards
        (exercise_id,recovery_score,capacity_score,
         chaos_score,overall_score,grade,report)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      exerciseId,
      Number(recoveryScore),
      Number(capacity),
      Number(chaosScore),
      result.score,
      result.grade,
      JSON.stringify(report)
    ]);

    res.status(201).json({
      scorecard:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not save resilience scorecard"
    });
  }
});

app.get("/api/resilience/scorecards",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM resilience_scorecards
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({scorecards:rows});
  }catch{
    res.status(500).json({
      error:"Could not load scorecards"
    });
  }
});

app.get("/api/resilience/operations",async(_req,res)=>{
  try{
    const [schedules,experiments,capacity,scorecards]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM exercise_schedules
        WHERE enabled=true
      `),
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM chaos_experiments
        GROUP BY status
      `),
      pool.query(`
        SELECT region_name,AVG(score) AS avg_score
        FROM capacity_scores
        GROUP BY region_name
        ORDER BY region_name
      `),
      pool.query(`
        SELECT grade,COUNT(*)::int AS count
        FROM resilience_scorecards
        GROUP BY grade
        ORDER BY grade
      `)
    ]);

    res.json({
      schedules:schedules.rows[0].count,
      experiments:experiments.rows,
      capacity:capacity.rows,
      scorecards:scorecards.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load resilience operations"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 83 Resilience API running"
));


module.exports = app;
