const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  runConfigurationChecks
}=require("./health-check");
const {
  severityForStatus
}=require("./probes");

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

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:102
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/security/health-probes",
async(_req,res)=>{
  const results=
    runConfigurationChecks(
      process.env
    );

  for(const result of results){
    try{
      const {rows}=await pool.query(`
        INSERT INTO security_health_probes
          (probe_type,target,status,
           details)
        VALUES($1,$2,$3,$4)
        RETURNING id
      `,[
        result.type,
        result.target||null,
        result.status,
        JSON.stringify(result)
      ]);

      const severity=
        severityForStatus(
          result.status
        );

      if(severity){
        await pool.query(`
          INSERT INTO security_health_alerts
            (probe_id,severity,reason)
          VALUES($1,$2,$3)
        `,[
          rows[0].id,
          severity,
          result.reason||
            "Security dependency health failure"
        ]);
      }
    }catch{}
  }

  res.json({
    phase:102,
    results
  });
});

app.get("/api/security/health-dashboard",
async(_req,res)=>{
  try{
    const [passes,warnings,failures,alerts]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_health_probes
          WHERE status='PASS'
          AND checked_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_health_probes
          WHERE status='WARN'
          AND checked_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_health_probes
          WHERE status IN ('FAIL','BLOCKED')
          AND checked_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_health_alerts
          WHERE status='OPEN'
        `)
      ]);

    res.json({
      passes24h:passes.rows[0].count,
      warnings24h:warnings.rows[0].count,
      failures24h:failures.rows[0].count,
      openAlerts:alerts.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load health dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 102 Security Health API running"
));


module.exports = app;
