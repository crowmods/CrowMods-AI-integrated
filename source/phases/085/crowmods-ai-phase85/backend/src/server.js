const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  anomalyScore,
  confidence,
  severityFromDeviation,
  multiWindowForecast,
  shouldEscalate
}=require("./intelligence");
const {MemoryAlertRouter}=require("./router");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const router=new MemoryAlertRouter();

const rank={
  INFO:0,
  WARNING:1,
  HIGH:2,
  CRITICAL:3
};

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:85,
  service:"resilience-intelligence"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/intelligence/anomaly",async(req,res)=>{
  const {
    regionName,
    metricName,
    history,
    observedValue
  }=req.body||{};

  if(!regionName||
     !metricName||
     !Array.isArray(history)||
     history.length<3||
     observedValue===undefined)
    return res.status(400).json({
      error:"regionName, metricName, history and observedValue are required"
    });

  const analysis=anomalyScore(
    history.map(Number),
    Number(observedValue)
  );

  const conf=confidence(history);
  const severity=severityFromDeviation(
    analysis.deviationScore
  );

  try{
    const {rows}=await pool.query(`
      INSERT INTO resilience_anomalies
        (region_name,metric_name,observed_value,
         baseline_value,deviation_score,confidence,severity)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      regionName,
      metricName,
      Number(observedValue),
      analysis.baseline,
      Number.isFinite(analysis.deviationScore)
        ?analysis.deviationScore
        :999999,
      conf,
      severity
    ]);

    res.status(201).json({
      anomaly:rows[0],
      analysis:{
        ...analysis,
        confidence:conf,
        severity
      }
    });
  }catch{
    res.status(500).json({
      error:"Could not record anomaly"
    });
  }
});

app.post("/api/intelligence/forecast",async(req,res)=>{
  const {
    regionName,
    values
  }=req.body||{};

  if(!regionName||
     !Array.isArray(values)||
     values.length<3)
    return res.status(400).json({
      error:"regionName and at least three values are required"
    });

  const forecast=multiWindowForecast(
    values.map(Number)
  );

  res.json({
    regionName,
    forecast
  });
});

app.post("/api/alerts",async(req,res)=>{
  const {
    dedupeKey,
    regionName,
    alertType,
    severity,
    message
  }=req.body||{};

  if(!dedupeKey||!alertType||!severity||!message)
    return res.status(400).json({
      error:"dedupeKey, alertType, severity and message are required"
    });

  try{
    const existing=(await pool.query(`
      SELECT *
      FROM resilience_alert_events
      WHERE dedupe_key=$1
    `,[dedupeKey])).rows[0];

    if(existing){
      const escalate=shouldEscalate({
        currentSeverity:severity,
        previousSeverity:existing.severity,
        occurrences:existing.occurrences+1
      });

      const nextSeverity=
        rank[severity]>rank[existing.severity]
          ?severity
          :existing.severity;

      const {rows}=await pool.query(`
        UPDATE resilience_alert_events
        SET occurrences=occurrences+1,
            last_seen_at=NOW(),
            severity=$2,
            escalation_level=escalation_level+$3
        WHERE dedupe_key=$1
        RETURNING *
      `,[
        dedupeKey,
        nextSeverity,
        escalate?1:0
      ]);

      if(escalate){
        await router.route({
          dedupeKey,
          regionName,
          alertType,
          severity:nextSeverity,
          message,
          escalation:true
        });
      }

      return res.json({
        alert:rows[0],
        deduplicated:true,
        escalated:escalate
      });
    }

    const {rows}=await pool.query(`
      INSERT INTO resilience_alert_events
        (dedupe_key,region_name,alert_type,severity,message)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      dedupeKey,
      regionName,
      alertType,
      severity,
      message
    ]);

    await router.route({
      dedupeKey,
      regionName,
      alertType,
      severity,
      message,
      escalation:false
    });

    res.status(201).json({
      alert:rows[0],
      deduplicated:false
    });
  }catch{
    res.status(500).json({
      error:"Could not process alert"
    });
  }
});

app.post("/api/alerts/routes",async(req,res)=>{
  const {
    routeName,
    severityMin="WARNING",
    destinationType,
    destinationRef
  }=req.body||{};

  if(!routeName||!destinationType||!destinationRef)
    return res.status(400).json({
      error:"routeName, destinationType and destinationRef are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO alert_routes
        (route_name,severity_min,
         destination_type,destination_ref)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      routeName,
      severityMin,
      destinationType,
      destinationRef
    ]);

    res.status(201).json({route:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create alert route"
    });
  }
});

app.post("/api/intelligence/executive-report",async(req,res)=>{
  const {
    periodStart,
    periodEnd
  }=req.body||{};

  if(!periodStart||!periodEnd)
    return res.status(400).json({
      error:"periodStart and periodEnd are required"
    });

  try{
    const [runs,anomalies,alerts]=await Promise.all([
      pool.query(`
        SELECT
          AVG(resilience_score) AS score,
          COUNT(*)::int AS count
        FROM exercise_runs
        WHERE started_at BETWEEN $1 AND $2
      `,[periodStart,periodEnd]),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM resilience_anomalies
        WHERE created_at BETWEEN $1 AND $2
      `,[periodStart,periodEnd]),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM resilience_alert_events
        WHERE created_at BETWEEN $1 AND $2
          AND status='OPEN'
      `,[periodStart,periodEnd])
    ]);

    const score=Number(runs.rows[0].score||0);

    const report={
      periodStart,
      periodEnd,
      exerciseRuns:runs.rows[0].count,
      overallScore:score,
      anomalyCount:anomalies.rows[0].count,
      openAlertCount:alerts.rows[0].count
    };

    const {rows}=await pool.query(`
      INSERT INTO executive_resilience_reports
        (period_start,period_end,overall_score,
         trend,anomaly_count,open_alert_count,report)
      VALUES($1,$2,$3,0,$4,$5,$6)
      RETURNING *
    `,[
      periodStart,
      periodEnd,
      score,
      report.anomalyCount,
      report.openAlertCount,
      JSON.stringify(report)
    ]);

    res.status(201).json({
      report:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create executive report"
    });
  }
});

app.get("/api/intelligence/operations",async(_req,res)=>{
  try{
    const [anomalies,alerts,routes,reports]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM resilience_anomalies
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM resilience_alert_events
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM alert_routes
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM executive_resilience_reports
      `)
    ]);

    res.json({
      anomalies:anomalies.rows[0].count,
      openAlerts:alerts.rows[0].count,
      activeRoutes:routes.rows[0].count,
      executiveReports:reports.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load intelligence operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 85 Intelligence API running"
));
