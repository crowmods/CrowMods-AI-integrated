const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  nextRunFromCadence,
  MemorySchedulerAdapter
}=require("./scheduler");
const {
  forecastScore,
  riskLevel,
  degradationDetected
}=require("./forecast");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const scheduler=new MemorySchedulerAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:84,
  service:"resilience-scheduler"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/scheduler/jobs",async(req,res)=>{
  const {
    jobName,
    cadence="weekly",
    nextRunAt=null
  }=req.body||{};

  if(!jobName)
    return res.status(400).json({
      error:"jobName is required"
    });

  const computedNext=nextRunAt||
    nextRunFromCadence(cadence);

  try{
    const {rows}=await pool.query(`
      INSERT INTO scheduler_jobs
        (job_name,cadence,next_run_at)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      jobName,
      cadence,
      computedNext
    ]);

    const scheduled=await scheduler.schedule(rows[0]);

    res.status(201).json({
      job:rows[0],
      scheduler:scheduled
    });
  }catch(error){
    res.status(500).json({
      error:error.message
    });
  }
});

app.post("/api/scheduler/jobs/:id/trigger",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM scheduler_jobs
      WHERE id=$1
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({
        error:"Scheduler job not found"
      });

    const result=await scheduler.trigger(rows[0]);

    await pool.query(`
      UPDATE scheduler_jobs
      SET last_run_at=NOW(),
          next_run_at=$2
      WHERE id=$1
    `,[
      req.params.id,
      nextRunFromCadence(rows[0].cadence)
    ]);

    res.json({trigger:result});
  }catch(error){
    res.status(500).json({
      error:error.message
    });
  }
});

app.post("/api/exercise-runs",async(req,res)=>{
  const {
    exerciseName,
    jobId=null,
    status="PASSED",
    resilienceScore=null,
    metadata={}
  }=req.body||{};

  if(!exerciseName)
    return res.status(400).json({
      error:"exerciseName is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO exercise_runs
        (job_id,exercise_name,status,resilience_score,
         started_at,completed_at,metadata)
      VALUES($1,$2,$3,$4,NOW(),NOW(),$5)
      RETURNING *
    `,[
      jobId,
      exerciseName,
      status,
      resilienceScore===null?null:Number(resilienceScore),
      JSON.stringify(metadata)
    ]);

    res.status(201).json({run:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not record exercise run"
    });
  }
});

app.post("/api/capacity/forecast",async(req,res)=>{
  const {
    regionName,
    scores,
    horizonHours=24
  }=req.body||{};

  if(!regionName||
     !Array.isArray(scores)||
     scores.length<2)
    return res.status(400).json({
      error:"regionName and at least two scores are required"
    });

  const horizonPoints=Math.max(
    1,
    Math.round(Number(horizonHours)/24)
  );

  const forecast=forecastScore(
    scores.map(Number),
    horizonPoints
  );

  const risk=riskLevel(forecast.forecast);

  try{
    const {rows}=await pool.query(`
      INSERT INTO capacity_forecasts
        (region_name,horizon_hours,current_score,
         forecast_score,trend,risk_level)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      regionName,
      Number(horizonHours),
      forecast.current,
      forecast.forecast,
      forecast.trend,
      risk
    ]);

    const degraded=degradationDetected({
      currentScore:forecast.current,
      forecastScore:forecast.forecast
    });

    if(degraded){
      await pool.query(`
        INSERT INTO resilience_alerts
          (region_name,alert_type,severity,message,
           observed_score,threshold)
        VALUES($1,'CAPACITY_DEGRADATION','WARNING',
               $2,$3,.8)
      `,[
        regionName,
        `Forecasted resilience degradation for ${regionName}`,
        forecast.forecast
      ]);
    }

    res.status(201).json({
      forecast:rows[0],
      degraded
    });
  }catch{
    res.status(500).json({
      error:"Could not generate capacity forecast"
    });
  }
});

app.get("/api/resilience/trends",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT
        DATE_TRUNC('day',started_at) AS day,
        AVG(resilience_score) AS avg_score,
        COUNT(*)::int AS runs
      FROM exercise_runs
      WHERE resilience_score IS NOT NULL
      GROUP BY DATE_TRUNC('day',started_at)
      ORDER BY day ASC
      LIMIT 90
    `);

    res.json({trends:rows});
  }catch{
    res.status(500).json({
      error:"Could not load resilience trends"
    });
  }
});

app.get("/api/resilience/alerts",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM resilience_alerts
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({alerts:rows});
  }catch{
    res.status(500).json({
      error:"Could not load resilience alerts"
    });
  }
});

app.get("/api/resilience/operations",async(_req,res)=>{
  try{
    const [jobs,runs,forecasts,alerts]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM scheduler_jobs
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM exercise_runs
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM capacity_forecasts
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM resilience_alerts
        WHERE acknowledged=false
      `)
    ]);

    res.json({
      scheduledJobs:jobs.rows[0].count,
      exerciseRuns:runs.rows[0].count,
      forecasts:forecasts.rows[0].count,
      openAlerts:alerts.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load resilience operations"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 84 Scheduler/Forecast API running"
));


module.exports = app;
