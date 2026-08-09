const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  DevelopmentKMSAdapter,
  DevelopmentWORMAdapter
}=require("./providers");
const {
  integrationCertification,
  drValidation
}=require("./certification");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const kms=new DevelopmentKMSAdapter();
const worm=new DevelopmentWORMAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:79,
  service:"provider-certification"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/providers/health",async(_req,res)=>{
  try{
    const [kmsHealth,wormHealth]=await Promise.all([
      kms.health(),
      worm.health()
    ]);

    const checks=[kmsHealth,wormHealth];

    for(const check of checks){
      await pool.query(`
        INSERT INTO provider_health_checks
          (adapter_type,provider_name,healthy,capabilities)
        VALUES($1,$2,$3,$4)
      `,[
        check.provider==="development-kms"?"KMS":"WORM",
        check.provider,
        check.healthy,
        JSON.stringify(check.capabilities)
      ]);
    }

    res.json({
      healthy:checks.every(c=>c.healthy),
      providers:checks
    });
  }catch{
    res.status(500).json({
      error:"Provider health check failed"
    });
  }
});

app.post("/api/providers/certify",async(req,res)=>{
  const {
    retentionReady=false
  }=req.body||{};

  try{
    const [kmsHealth,wormHealth]=await Promise.all([
      kms.health(),
      worm.health()
    ]);

    const result=integrationCertification({
      kmsReady:kmsHealth.healthy,
      wormReady:wormHealth.healthy,
      retentionReady,
      healthChecksPassed:
        kmsHealth.healthy&&wormHealth.healthy
    });

    const {rows}=await pool.query(`
      INSERT INTO integration_certifications
        (certification_name,environment,kms_ready,worm_ready,
         retention_ready,health_checks_passed,certified)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      "CrowMods Provider Integration",
      process.env.NODE_ENV||"development",
      result.gates.kmsReady,
      result.gates.wormReady,
      result.gates.retentionReady,
      result.gates.healthChecksPassed,
      result.certified
    ]);

    res.json({
      certification:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not certify providers"
    });
  }
});

app.post("/api/dr/validate",async(req,res)=>{
  const {
    runName="scheduled-dr-validation",
    backupVerified=false,
    restoreVerified=false,
    integrityVerified=false,
    providerReconnectVerified=false,
    notes=""
  }=req.body||{};

  const result=drValidation({
    backupVerified,
    restoreVerified,
    integrityVerified,
    providerReconnectVerified
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO dr_validation_runs
        (run_name,backup_verified,restore_verified,
         integrity_verified,provider_reconnect_verified,
         passed,notes)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      runName,
      result.gates.backupVerified,
      result.gates.restoreVerified,
      result.gates.integrityVerified,
      result.gates.providerReconnectVerified,
      result.passed,
      notes
    ]);

    res.json({
      validation:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not record DR validation"
    });
  }
});

app.post("/api/providers/worm/test-object",async(req,res)=>{
  const {
    objectKey,
    content="crowmods-test",
    retentionUntil
  }=req.body||{};

  if(!objectKey||!retentionUntil)
    return res.status(400).json({
      error:"objectKey and retentionUntil are required"
    });

  try{
    const result=await worm.put(
      objectKey,
      content,
      retentionUntil
    );

    const retentionVerified=
      await worm.verifyRetention(
        objectKey,
        retentionUntil
      );

    res.status(201).json({
      object:result,
      retentionVerified
    });
  }catch(error){
    res.status(409).json({
      error:error.message
    });
  }
});

app.get("/api/providers/operations",async(_req,res)=>{
  try{
    const [health,certifications,dr]=await Promise.all([
      pool.query(`
        SELECT *
        FROM provider_health_checks
        ORDER BY checked_at DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT *
        FROM integration_certifications
        ORDER BY certified_at DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT *
        FROM dr_validation_runs
        ORDER BY created_at DESC
        LIMIT 20
      `)
    ]);

    res.json({
      health:health.rows,
      certifications:certifications.rows,
      drValidations:dr.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load provider operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 79 Provider Certification API running"
));
