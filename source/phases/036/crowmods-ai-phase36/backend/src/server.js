const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {fingerprint,classifyIncident}=require("./monitoring");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:36,
  service:"monitoring"
}));

app.post("/api/monitoring/health",async(req,res)=>{
  const {
    serviceName,
    status="UP",
    latencyMs=null,
    details={}
  }=req.body||{};

  if(!serviceName)return res.status(400).json({error:"serviceName is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO service_health(service_name,status,latency_ms,details)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[serviceName,status,latencyMs,details]);

    res.status(201).json({health:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record health"});
  }
});

app.post("/api/monitoring/alert",async(req,res)=>{
  const {
    alertType,
    severity="MEDIUM",
    serviceName=null,
    message,
    metadata={}
  }=req.body||{};

  if(!alertType||!message)
    return res.status(400).json({error:"alertType and message are required"});

  const fp=fingerprint(alertType,serviceName,message);

  try{
    const {rows}=await pool.query(`
      INSERT INTO monitoring_alerts
        (alert_type,severity,service_name,fingerprint,message,metadata)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(fingerprint)
      DO UPDATE SET
        severity=EXCLUDED.severity,
        metadata=EXCLUDED.metadata,
        status='OPEN'
      RETURNING *
    `,[alertType,severity,serviceName,fp,message,metadata]);

    const alert=rows[0];

    if(severity==="HIGH"||severity==="CRITICAL"){
      const incident=(
        await pool.query(`
          INSERT INTO incidents
            (title,severity,status,source_alert_id,summary)
          VALUES($1,$2,'OPEN',$3,$4)
          RETURNING *
        `,[
          `${serviceName||"System"}: ${alertType}`,
          severity,
          alert.id,
          message
        ])
      ).rows[0];

      const classification=classifyIncident(alert);

      await pool.query(`
        INSERT INTO incident_timeline
          (incident_id,action,message,metadata)
        VALUES($1,'INCIDENT_CREATED',$2,$3)
      `,[
        incident.id,
        classification.action,
        JSON.stringify({priority:classification.priority})
      ]);

      return res.status(201).json({
        alert,
        incident,
        classification
      });
    }

    res.status(201).json({alert});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create alert"});
  }
});

app.get("/api/monitoring/alerts",async(req,res)=>{
  const status=req.query.status||"OPEN";

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM monitoring_alerts
      WHERE status=$1
      ORDER BY created_at DESC
      LIMIT 200
    `,[status]);

    res.json({alerts:rows});
  }catch{
    res.status(500).json({error:"Could not load alerts"});
  }
});

app.get("/api/monitoring/incidents",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM incidents
      WHERE status<>'RESOLVED'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({incidents:rows});
  }catch{
    res.status(500).json({error:"Could not load incidents"});
  }
});

app.post("/api/monitoring/incidents/:id/timeline",async(req,res)=>{
  const {
    action,
    message="",
    actorRef="authorized-admin",
    metadata={}
  }=req.body||{};

  if(!action)return res.status(400).json({error:"action is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_timeline
        (incident_id,actor_ref,action,message,metadata)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[req.params.id,actorRef,action,message,metadata]);

    res.status(201).json({entry:rows[0]});
  }catch{
    res.status(500).json({error:"Could not add timeline entry"});
  }
});

app.post("/api/monitoring/incidents/:id/resolve",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      UPDATE incidents
      SET status='RESOLVED',resolved_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])return res.status(404).json({error:"Incident not found"});

    await pool.query(`
      INSERT INTO incident_timeline
        (incident_id,actor_ref,action,message)
      VALUES($1,'authorized-admin','RESOLVED','Incident resolved')
    `,[req.params.id]);

    if(rows[0].source_alert_id){
      await pool.query(`
        UPDATE monitoring_alerts
        SET status='RESOLVED',resolved_at=NOW()
        WHERE id=$1
      `,[rows[0].source_alert_id]);
    }

    res.json({incident:rows[0]});
  }catch{
    res.status(500).json({error:"Could not resolve incident"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 36 Monitoring API running"));
