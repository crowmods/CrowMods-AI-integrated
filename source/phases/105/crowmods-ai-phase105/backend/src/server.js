const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  validateWorkloadIdentity
}=require("./workload-identity");
const {
  acquireCertificateMetadata
}=require("./tls-acquisition");
const {
  ProductionKmsContract
}=require("./kms-contract");
const {
  evaluateSlo,
  breachSeverity
}=require("./slo");

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

const kms=new ProductionKmsContract({
  provider:process.env.KMS_PROVIDER,
  keyId:process.env.KMS_KEY_ID,
  algorithm:process.env.KMS_ALGORITHM,
  region:process.env.KMS_REGION
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:105
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/security/workload-identity/validate",
async(req,res)=>{
  const result=validateWorkloadIdentity({
    ...req.body,
    expectedAudience:
      process.env.SIEM_AUDIENCE,
    expectedIssuer:
      process.env.WORKLOAD_IDENTITY_ISSUER
  });

  try{
    await pool.query(`
      INSERT INTO workload_identity_events
        (provider,subject,audience,status)
      VALUES($1,$2,$3,$4)
    `,[
      process.env.WORKLOAD_IDENTITY_PROVIDER||
        "configured-provider",
      req.body?.subject||"unknown",
      req.body?.audience||"unknown",
      result.status
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/certificate/acquire",
async(req,res)=>{
  const result=await acquireCertificateMetadata({
    host:req.body?.host,
    port:req.body?.port||443,
    connector:null
  });

  res.json({
    result,
    adapterMode:"PRODUCTION_TLS_CONNECTOR_REQUIRED"
  });
});

app.get("/api/security/kms/status",(_req,res)=>{
  res.json({
    provider:kms.provider,
    keyId:kms.keyId,
    algorithm:kms.algorithm,
    region:kms.region,
    validation:kms.validate()
  });
});

app.post("/api/security/slo/evaluate",
async(req,res)=>{
  const {
    sloId,
    total,
    successful,
    targetPercent
  }=req.body||{};

  try{
    const result=evaluateSlo({
      total:Number(total),
      successful:Number(successful),
      targetPercent:Number(targetPercent)
    });

    if(sloId){
      await pool.query(`
        INSERT INTO security_slo_measurements
          (slo_id,total_events,
           successful_events,
           availability_percent,status)
        VALUES($1,$2,$3,$4,$5)
      `,[
        sloId,
        Number(total),
        Number(successful),
        result.availabilityPercent||0,
        result.status
      ]);

      if(result.status==="BREACH"){
        await pool.query(`
          INSERT INTO security_slo_alerts
            (slo_id,severity,reason)
          VALUES($1,$2,$3)
        `,[
          sloId,
          breachSeverity({
            targetPercent:Number(targetPercent),
            availabilityPercent:
              result.availabilityPercent
          }),
          "Security SLO target breached"
        ]);
      }
    }

    res.json(result);
  }catch(error){
    res.status(400).json({
      error:error.message
    });
  }
});

app.get("/api/security/slo-dashboard",
async(_req,res)=>{
  try{
    const [passes,breaches,alerts,identity]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_slo_measurements
          WHERE status='PASS'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_slo_measurements
          WHERE status='BREACH'
          AND measured_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM security_slo_alerts
          WHERE status='OPEN'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM workload_identity_events
          WHERE status='ACCEPTED'
          AND created_at>NOW()-INTERVAL '24 hours'
        `)
      ]);

    res.json({
      sloPasses24h:passes.rows[0].count,
      sloBreaches24h:breaches.rows[0].count,
      openSloAlerts:alerts.rows[0].count,
      acceptedWorkloadIdentity24h:
        identity.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load SLO dashboard"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 105 SLO API running"
));
