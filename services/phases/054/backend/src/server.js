const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {createSecretProvider}=require("./secrets");
const {sanitizeMetadata,log,metric}=require("./observability");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

app.use((req,res,next)=>{
  req.requestId=crypto.randomUUID();
  req.traceId=req.headers["x-trace-id"]||crypto.randomUUID();
  res.setHeader("X-Request-ID",req.requestId);
  res.setHeader("X-Trace-ID",req.traceId);
  next();
});

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const secrets=createSecretProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  service:process.env.SERVICE_NAME||"crowmods-api",
  phase:54
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/observability/log",async(req,res)=>{
  const {
    level="INFO",
    eventName="application.event",
    message="",
    metadata={}
  }=req.body||{};

  try{
    const entry=log(
      level,eventName,message,
      sanitizeMetadata(metadata)
    );

    await pool.query(`
      INSERT INTO observability_events
        (level,service,event_name,request_id,trace_id,message,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7)
    `,[
      entry.level,
      process.env.SERVICE_NAME||"crowmods-api",
      entry.eventName,
      req.requestId,
      req.traceId,
      entry.message,
      entry.metadata
    ]);

    res.status(201).json({
      recorded:true,
      requestId:req.requestId
    });
  }catch{
    res.status(500).json({error:"Could not record log"});
  }
});

app.post("/api/observability/metrics",async(req,res)=>{
  const {
    metricName,
    value,
    labels={}
  }=req.body||{};

  if(!metricName||!Number.isFinite(Number(value)))
    return res.status(400).json({
      error:"metricName and numeric value are required"
    });

  try{
    const sample=metric(
      metricName,
      value,
      sanitizeMetadata(labels)
    );

    await pool.query(`
      INSERT INTO metric_samples(metric_name,metric_value,labels)
      VALUES($1,$2,$3)
    `,[
      sample.metricName,
      sample.value,
      sample.labels
    ]);

    res.status(201).json({sample});
  }catch{
    res.status(500).json({error:"Could not record metric"});
  }
});

app.post("/api/secrets/reference",async(req,res)=>{
  const {
    provider=process.env.SECRETS_PROVIDER||"env",
    secretName,
    versionRef=null
  }=req.body||{};

  if(!secretName)
    return res.status(400).json({error:"secretName is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO secret_references
        (provider,secret_name,version_ref)
      VALUES($1,$2,$3)
      ON CONFLICT(provider,secret_name)
      DO UPDATE SET
        version_ref=EXCLUDED.version_ref,
        status='ACTIVE'
      RETURNING id,provider,secret_name,version_ref,status
    `,[provider,secretName,versionRef]);

    res.status(201).json({reference:rows[0]});
  }catch{
    res.status(500).json({error:"Could not register secret reference"});
  }
});

app.post("/api/secrets/rotate",async(req,res)=>{
  const {secretName}=req.body||{};

  if(!secretName)
    return res.status(400).json({error:"secretName is required"});

  try{
    const result=await secrets.rotate(secretName);

    await pool.query(`
      UPDATE secret_references
      SET status='ROTATING',updated_at=NOW()
      WHERE secret_name=$1
    `.replace("updated_at=NOW(),",""),[secretName]);

    res.json({result});
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

app.post("/api/incidents",async(req,res)=>{
  const {
    severity="MEDIUM",
    title,
    description="",
    service=process.env.SERVICE_NAME||"crowmods-api",
    metadata={}
  }=req.body||{};

  if(!title)
    return res.status(400).json({error:"title is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO incidents
        (severity,title,description,service,metadata)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      severity,title,description,service,
      sanitizeMetadata(metadata)
    ]);

    res.status(201).json({incident:rows[0]});
  }catch{
    res.status(500).json({error:"Could not create incident"});
  }
});

app.get("/api/operations/overview",async(_req,res)=>{
  try{
    const incidents=(await pool.query(`
      SELECT severity,status,COUNT(*)::int AS count
      FROM incidents
      WHERE status<>'RESOLVED'
      GROUP BY severity,status
      ORDER BY severity
    `)).rows;

    const metrics=(await pool.query(`
      SELECT metric_name,metric_value,labels,sampled_at
      FROM metric_samples
      ORDER BY sampled_at DESC
      LIMIT 100
    `)).rows;

    res.json({
      service:process.env.SERVICE_NAME||"crowmods-api",
      phase:54,
      openIncidents:incidents,
      recentMetrics:metrics
    });
  }catch{
    res.status(500).json({error:"Could not load operations overview"});
  }
});

app.get("/api/operations/siem-event-contract",(_req,res)=>{
  res.json({
    version:"1.0",
    fields:[
      "timestamp",
      "service",
      "level",
      "eventName",
      "requestId",
      "traceId",
      "message",
      "metadata"
    ],
    transport:"HTTPS/syslog/provider-specific SIEM connector"
  });
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 54 Observability API running"));


module.exports = app;
