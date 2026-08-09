const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  validateIngestionEvent,
  deduplicateEvents
}=require("./timeline-ingestion");
const {
  createSnapshot,
  DevelopmentSnapshotSigner
}=require("./timeline-snapshot");
const {
  evaluateActionSla
}=require("./action-sla");
const {
  buildPostmortemReport
}=require("./postmortem-report");

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

const signer=new DevelopmentSnapshotSigner(
  process.env.DEV_TIMELINE_SIGNING_SECRET||
  "development-only"
);

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:110
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/timeline/ingest",
async(req,res)=>{
  const result=validateIngestionEvent(
    req.body||{}
  );

  if(result.status!=="ACCEPTED")
    return res.status(400).json(result);

  try{
    await pool.query(`
      INSERT INTO timeline_ingestion_events
        (incident_id,source,event_type,
         event_time,source_event_id,payload)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      req.body.incidentId||null,
      result.source,
      result.eventType,
      result.eventTime,
      result.sourceEventId,
      JSON.stringify(req.body.payload||{})
    ]);
  }catch{}

  res.status(202).json(result);
});

app.post("/api/security/timeline/deduplicate",
(req,res)=>{
  res.json({
    events:deduplicateEvents(
      req.body?.events||[]
    )
  });
});

app.post("/api/security/timeline/snapshot",
async(req,res)=>{
  const events=req.body?.events||[];

  const snapshot=createSnapshot({
    incidentId:req.body?.incidentId,
    version:Number(req.body?.version)||1,
    events,
    signer
  });

  if(req.body?.incidentId){
    try{
      await pool.query(`
        INSERT INTO timeline_snapshots
          (incident_id,snapshot_version,
           digest,signature,key_version,
           algorithm,event_count,snapshot)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      `,[
        req.body.incidentId,
        Number(req.body.version)||1,
        snapshot.digest,
        snapshot.signature,
        snapshot.keyVersion,
        snapshot.algorithm,
        snapshot.eventCount,
        JSON.stringify(snapshot.snapshot)
      ]);
    }catch{}
  }

  res.json({
    ...snapshot,
    signerMode:"DEVELOPMENT_ADAPTER"
  });
});

app.post("/api/security/action-sla/evaluate",
async(req,res)=>{
  const result=evaluateActionSla({
    dueAt:req.body?.dueAt,
    now:req.body?.now||new Date(),
    warningHours:
      Number(req.body?.warningHours)||24
  });

  if(req.body?.actionId){
    try{
      await pool.query(`
        INSERT INTO action_sla_checks
          (action_id,due_at,status,severity)
        VALUES($1,$2,$3,$4)
      `,[
        req.body.actionId,
        req.body.dueAt,
        result.status,
        result.severity
      ]);
    }catch{}
  }

  res.json(result);
});

app.post("/api/security/postmortem/report",
async(req,res)=>{
  const report=buildPostmortemReport({
    windowDays:Number(req.body?.windowDays)||30,
    incidentCount:Number(req.body?.incidentCount)||0,
    openActionCount:
      Number(req.body?.openActionCount)||0,
    overdueActionCount:
      Number(req.body?.overdueActionCount)||0,
    criticalIncidentCount:
      Number(req.body?.criticalIncidentCount)||0
  });

  try{
    await pool.query(`
      INSERT INTO postmortem_reports
        (report_window_days,incident_count,
         open_action_count,overdue_action_count,
         critical_incident_count,digest)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      report.windowDays,
      report.incidentCount,
      report.openActionCount,
      report.overdueActionCount,
      report.criticalIncidentCount,
      report.digest
    ]);
  }catch{}

  res.json(report);
});

app.get("/api/security/postmortem-dashboard",
async(_req,res)=>{
  try{
    const [ingest,snapshots,overdue,reports]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM timeline_ingestion_events
          WHERE ingested_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM timeline_snapshots
          WHERE created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM action_sla_checks
          WHERE status='OVERDUE'
          AND checked_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM postmortem_reports
          WHERE generated_at>NOW()-INTERVAL '30 days'
        `)
      ]);

    res.json({
      ingestedEvents24h:
        ingest.rows[0].count,
      signedSnapshots24h:
        snapshots.rows[0].count,
      overdueActions24h:
        overdue.rows[0].count,
      reports30d:
        reports.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load postmortem dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 110 Postmortem API running"
));
