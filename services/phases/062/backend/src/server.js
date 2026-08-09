const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {evaluate}=require("./slo");

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
  phase:62,
  service:"live-monitoring"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/monitoring/metrics",async(req,res)=>{
  const {
    service="crowmods",
    metricName,
    value,
    labels={}
  }=req.body||{};

  if(!metricName||!Number.isFinite(Number(value)))
    return res.status(400).json({
      error:"metricName and numeric value are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO telemetry_samples
        (service,metric_name,metric_value,labels)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[service,metricName,Number(value),labels]);

    res.status(201).json({sample:rows[0]});
  }catch{
    res.status(500).json({error:"Could not store metric"});
  }
});

app.post("/api/monitoring/evaluate",async(req,res)=>{
  const {
    service="crowmods",
    errorRate,
    latencyMs,
    healthRate,
    maxErrorRate=.02,
    maxLatencyMs=1000,
    minHealthRate=.99
  }=req.body||{};

  const result=evaluate({
    errorRate,
    latencyMs,
    healthRate,
    maxErrorRate,
    maxLatencyMs,
    minHealthRate
  });

  try{
    if(!result.healthy){
      await pool.query(`
        INSERT INTO monitoring_alerts
          (service,alert_name,severity,condition,
           observed_value,threshold)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        service,
        "slo-breach",
        result.burnRate>=5?"CRITICAL":"HIGH",
        "SLO threshold exceeded",
        result.burnRate,
        1
      ]);
    }

    res.json({
      service,
      ...result
    });
  }catch{
    res.status(500).json({
      error:"Could not record SLO evaluation"
    });
  }
});

app.get("/api/monitoring/summary",async(req,res)=>{
  const service=req.query.service||"crowmods";

  try{
    const metrics=(await pool.query(`
      SELECT metric_name,metric_value,labels,observed_at
      FROM telemetry_samples
      WHERE service=$1
      ORDER BY observed_at DESC
      LIMIT 100
    `,[service])).rows;

    const alerts=(await pool.query(`
      SELECT *
      FROM monitoring_alerts
      WHERE service=$1 AND status<>'RESOLVED'
      ORDER BY created_at DESC
      LIMIT 50
    `,[service])).rows;

    res.json({
      service,
      metrics,
      alerts
    });
  }catch{
    res.status(500).json({error:"Could not load monitoring summary"});
  }
});

app.post("/api/monitoring/alerts/:id/resolve",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      UPDATE monitoring_alerts
      SET status='RESOLVED',resolved_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({error:"Alert not found"});

    res.json({alert:rows[0]});
  }catch{
    res.status(500).json({error:"Could not resolve alert"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 62 Live Monitoring API running"
));


module.exports = app;
