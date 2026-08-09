const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  transition,
  correlateIncident,
  shouldReopen,
  retryEligible
}=require("./lifecycle");
const {
  MemoryTelemetryExporter
}=require("./telemetry");
const {
  MemoryNotificationProvider
}=require("./notifications");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const telemetry=new MemoryTelemetryExporter();
const notifier=new MemoryNotificationProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:87,
  service:"alert-lifecycle"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/alerts/:id/lifecycle",async(req,res)=>{
  const {
    event,
    actor="system",
    metadata={}
  }=req.body||{};

  if(!event)
    return res.status(400).json({
      error:"event is required"
    });

  const allowed=[
    "CREATED",
    "ACKNOWLEDGED",
    "RESOLVED",
    "REOPENED",
    "ESCALATED"
  ];

  if(!allowed.includes(event))
    return res.status(400).json({
      error:"Unsupported lifecycle event"
    });

  try{
    const existing=(await pool.query(`
      SELECT status
      FROM resilience_alert_events
      WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!existing)
      return res.status(404).json({
        error:"Alert not found"
      });

    const nextStatus=transition(
      existing.status,
      event
    );

    const {rows}=await pool.query(`
      UPDATE resilience_alert_events
      SET status=$2,last_seen_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,
      nextStatus
    ]);

    await pool.query(`
      INSERT INTO alert_lifecycle_events
        (alert_id,event_type,actor,metadata)
      VALUES($1,$2,$3,$4)
    `,[
      req.params.id,
      event,
      actor,
      JSON.stringify(metadata)
    ]);

    res.json({
      alert:rows[0],
      event
    });
  }catch{
    res.status(500).json({
      error:"Could not update alert lifecycle"
    });
  }
});

app.post("/api/incidents/correlate",async(req,res)=>{
  const {
    correlationKey,
    title,
    alerts=[]
  }=req.body||{};

  if(!correlationKey||!title||!Array.isArray(alerts))
    return res.status(400).json({
      error:"correlationKey, title and alerts are required"
    });

  const correlation=correlateIncident(alerts);

  try{
    const existing=(await pool.query(`
      SELECT *
      FROM incidents
      WHERE correlation_key=$1
    `,[correlationKey])).rows[0];

    let incident;

    if(existing){
      const reopen=shouldReopen({
        incidentStatus:existing.status,
        incomingSeverity:correlation.highestSeverity,
        previousSeverity:existing.severity
      });

      const nextStatus=reopen
        ?"OPEN"
        :existing.status;

      incident=(await pool.query(`
        UPDATE incidents
        SET title=$2,
            severity=$3,
            status=$4,
            alert_count=$5,
            slo_breach=$6,
            updated_at=NOW(),
            resolved_at=CASE
              WHEN $4='RESOLVED' THEN resolved_at
              ELSE NULL
            END
        WHERE id=$1
        RETURNING *
      `,[
        existing.id,
        title,
        correlation.highestSeverity,
        nextStatus,
        correlation.alertCount,
        correlation.sloBreach
      ])).rows[0];
    }else{
      incident=(await pool.query(`
        INSERT INTO incidents
          (correlation_key,title,severity,
           alert_count,slo_breach)
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
      `,[
        correlationKey,
        title,
        correlation.highestSeverity,
        correlation.alertCount,
        correlation.sloBreach
      ])).rows[0];
    }

    for(const alert of alerts){
      if(!alert.id) continue;

      await pool.query(`
        INSERT INTO incident_alerts
          (incident_id,alert_id)
        VALUES($1,$2)
        ON CONFLICT DO NOTHING
      `,[
        incident.id,
        alert.id
      ]);
    }

    res.status(201).json({
      incident,
      correlation
    });
  }catch{
    res.status(500).json({
      error:"Could not correlate incident"
    });
  }
});

app.post("/api/incidents/:id/resolve",async(req,res)=>{
  const {
    actor="operator"
  }=req.body||{};

  try{
    const {rows}=await pool.query(`
      UPDATE incidents
      SET status='RESOLVED',
          resolved_at=NOW(),
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({
        error:"Incident not found"
      });

    res.json({
      incident:rows[0],
      actor
    });
  }catch{
    res.status(500).json({
      error:"Could not resolve incident"
    });
  }
});

app.post("/api/notifications/retry-worker",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM notification_deliveries
      WHERE status IN ('FAILED','PENDING')
        AND (next_attempt_at IS NULL OR next_attempt_at<=NOW())
      ORDER BY created_at
      LIMIT 50
    `);

    const results=[];

    for(const delivery of rows){
      const eligible=retryEligible({
        status:delivery.status,
        attempts:delivery.attempts,
        maxAttempts:5,
        nextAttemptAt:delivery.next_attempt_at
      });

      if(!eligible) continue;

      try{
        const result=await notifier.send(
          delivery.destination,
          `Retry notification ${delivery.id}`
        );

        await pool.query(`
          UPDATE notification_deliveries
          SET status='SENT',
              attempts=attempts+1,
              delivered_at=NOW(),
              last_error=NULL
          WHERE id=$1
        `,[delivery.id]);

        results.push({
          id:delivery.id,
          status:"SENT",
          result
        });
      }catch(error){
        await pool.query(`
          UPDATE notification_deliveries
          SET attempts=attempts+1,
              status=CASE
                WHEN attempts+1>=5 THEN 'DLQ'
                ELSE 'FAILED'
              END,
              last_error=$2
          WHERE id=$1
        `,[
          delivery.id,
          error.message
        ]);

        results.push({
          id:delivery.id,
          status:"FAILED"
        });
      }
    }

    res.json({
      processed:results.length,
      results
    });
  }catch{
    res.status(500).json({
      error:"Retry worker failed"
    });
  }
});

app.post("/api/notifications/dlq/replay",async(req,res)=>{
  const {
    limit=20
  }=req.body||{};

  try{
    const {rows}=await pool.query(`
      UPDATE notification_deliveries
      SET status='PENDING',
          attempts=0,
          next_attempt_at=NOW(),
          last_error=NULL
      WHERE id IN (
        SELECT id
        FROM notification_deliveries
        WHERE status='DLQ'
        ORDER BY created_at
        LIMIT $1
      )
      RETURNING *
    `,[Number(limit)]);

    res.json({
      replayed:rows.length,
      deliveries:rows
    });
  }catch{
    res.status(500).json({
      error:"DLQ replay failed"
    });
  }
});

app.post("/api/telemetry/export",async(req,res)=>{
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
    const result=await telemetry.exportMetric({
      metricName,
      metricValue:Number(metricValue),
      labels
    });

    const {rows}=await pool.query(`
      INSERT INTO telemetry_exports
        (exporter,metric_name,metric_value,
         labels,status,exported_at)
      VALUES('memory',$1,$2,$3,'EXPORTED',NOW())
      RETURNING *
    `,[
      metricName,
      Number(metricValue),
      JSON.stringify(labels)
    ]);

    res.status(201).json({
      export:rows[0],
      result
    });
  }catch(error){
    res.status(500).json({
      error:error.message
    });
  }
});

app.get("/api/operations/alert-lifecycle",async(_req,res)=>{
  try{
    const [incidents,deliveries,lifecycle,telemetryRows]=await Promise.all([
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM incidents
        GROUP BY status
      `),
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM notification_deliveries
        GROUP BY status
      `),
      pool.query(`
        SELECT event_type,COUNT(*)::int AS count
        FROM alert_lifecycle_events
        GROUP BY event_type
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM telemetry_exports
        WHERE status='EXPORTED'
      `)
    ]);

    res.json({
      incidents:incidents.rows,
      deliveries:deliveries.rows,
      lifecycle:lifecycle.rows,
      exportedMetrics:telemetryRows.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load alert lifecycle operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 87 Alert Lifecycle API running"
));
