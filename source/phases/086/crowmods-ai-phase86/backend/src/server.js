const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  shouldSuppress,
  nextBackoff,
  deliveryStatus,
  correlateAlerts,
  policyMatch
}=require("./alerts");
const {
  MemoryNotificationProvider
}=require("./notification");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const notifier=new MemoryNotificationProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:86,
  service:"alert-operations"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/notifications/deliver",async(req,res)=>{
  const {
    alertId=null,
    provider="memory",
    destination,
    message,
    attempts=1,
    maxAttempts=5
  }=req.body||{};

  if(!destination||!message)
    return res.status(400).json({
      error:"destination and message are required"
    });

  try{
    const result=await notifier.send(
      destination,
      message
    );

    const status=deliveryStatus({
      success:result.sent,
      attempts,
      maxAttempts
    });

    const {rows}=await pool.query(`
      INSERT INTO notification_deliveries
        (alert_id,provider,destination,status,
         attempts,delivered_at)
      VALUES($1,$2,$3,$4,$5,NOW())
      RETURNING *
    `,[
      alertId,
      provider,
      destination,
      status,
      Number(attempts)
    ]);

    res.status(201).json({
      delivery:rows[0],
      result
    });
  }catch(error){
    const status=deliveryStatus({
      success:false,
      attempts,
      maxAttempts
    });

    const {rows}=await pool.query(`
      INSERT INTO notification_deliveries
        (alert_id,provider,destination,status,
         attempts,last_error,next_attempt_at)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      alertId,
      provider,
      destination,
      status,
      Number(attempts),
      error.message,
      status==="DLQ"?null:nextBackoff(attempts)
    ]);

    res.status(202).json({
      delivery:rows[0]
    });
  }
});

app.post("/api/alerts/suppressions",async(req,res)=>{
  const {
    suppressionKey,
    reason,
    startsAt,
    endsAt
  }=req.body||{};

  if(!suppressionKey||!reason||!startsAt||!endsAt)
    return res.status(400).json({
      error:"suppressionKey, reason, startsAt and endsAt are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO alert_suppressions
        (suppression_key,reason,starts_at,ends_at)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      suppressionKey,
      reason,
      startsAt,
      endsAt
    ]);

    res.status(201).json({suppression:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create suppression"
    });
  }
});

app.post("/api/alerts/suppression-check",async(req,res)=>{
  const {
    suppressionKey,
    now=new Date().toISOString()
  }=req.body||{};

  if(!suppressionKey)
    return res.status(400).json({
      error:"suppressionKey is required"
    });

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM alert_suppressions
      WHERE suppression_key=$1
      ORDER BY created_at DESC
      LIMIT 1
    `,[suppressionKey]);

    if(!rows[0])
      return res.json({suppressed:false});

    res.json({
      suppressed:shouldSuppress({
        now,
        startsAt:rows[0].starts_at,
        endsAt:rows[0].ends_at
      }),
      suppression:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not check suppression"
    });
  }
});

app.post("/api/observability/metrics",async(req,res)=>{
  const {
    metricName,
    metricValue,
    labels={}
  }=req.body||{};

  if(!metricName||metricValue===undefined)
    return res.status(400).json({
      error:"metricName and metricValue are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO observability_metrics
        (metric_name,metric_value,labels)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      metricName,
      Number(metricValue),
      JSON.stringify(labels)
    ]);

    res.status(201).json({metric:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not record metric"
    });
  }
});

app.post("/api/anomaly-policies",async(req,res)=>{
  const {
    policyName,
    metricName,
    threshold,
    severity="WARNING"
  }=req.body||{};

  if(!policyName||!metricName||threshold===undefined)
    return res.status(400).json({
      error:"policyName, metricName and threshold are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO anomaly_policies
        (policy_name,metric_name,threshold,severity)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      policyName,
      metricName,
      Number(threshold),
      severity
    ]);

    res.status(201).json({policy:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create anomaly policy"
    });
  }
});

app.post("/api/anomaly-policies/evaluate",async(req,res)=>{
  const {
    value,
    threshold
  }=req.body||{};

  if(value===undefined||threshold===undefined)
    return res.status(400).json({
      error:"value and threshold are required"
    });

  res.json({
    matched:policyMatch(value,threshold),
    value:Number(value),
    threshold:Number(threshold)
  });
});

app.post("/api/alerts/correlate",async(req,res)=>{
  const {
    correlationKey,
    incidentId=null,
    alerts=[]
  }=req.body||{};

  if(!correlationKey||!Array.isArray(alerts))
    return res.status(400).json({
      error:"correlationKey and alerts are required"
    });

  const correlation=correlateAlerts(alerts);

  try{
    const {rows}=await pool.query(`
      INSERT INTO alert_correlations
        (correlation_key,incident_id,alert_count,
         slo_breach,highest_severity)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(correlation_key)
      DO UPDATE SET
        alert_count=EXCLUDED.alert_count,
        slo_breach=EXCLUDED.slo_breach,
        highest_severity=EXCLUDED.highest_severity,
        updated_at=NOW()
      RETURNING *
    `,[
      correlationKey,
      incidentId,
      correlation.count,
      correlation.sloBreach,
      correlation.highestSeverity
    ]);

    res.status(201).json({
      correlation:rows[0],
      result:correlation
    });
  }catch{
    res.status(500).json({
      error:"Could not correlate alerts"
    });
  }
});

app.get("/api/alert-center",async(_req,res)=>{
  try{
    const [deliveries,suppressions,correlations,metrics]=await Promise.all([
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM notification_deliveries
        GROUP BY status
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM alert_suppressions
        WHERE NOW() BETWEEN starts_at AND ends_at
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM alert_correlations
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT metric_name,metric_value,observed_at
        FROM observability_metrics
        ORDER BY observed_at DESC
        LIMIT 50
      `)
    ]);

    res.json({
      deliveries:deliveries.rows,
      activeSuppressions:suppressions.rows[0].count,
      openCorrelations:correlations.rows[0].count,
      metrics:metrics.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load alert center"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 86 Alert Operations API running"
));
