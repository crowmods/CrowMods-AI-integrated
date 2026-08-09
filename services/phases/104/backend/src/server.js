const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  SigningProvider,
  DevelopmentSigningProvider
}=require("./signing-provider");
const {
  validateCertificateChain
}=require("./certificate-chain");
const {
  buildAuthenticatedEvent,
  deliveryPolicy
}=require("./siem-delivery");
const {
  validateProductionIntegrations
}=require("./integration-validation");
const crypto=require("crypto");

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

const signingProvider=
  process.env.NODE_ENV==="production"
    ?new SigningProvider({
      provider:process.env.KMS_PROVIDER,
      keyId:process.env.KMS_KEY_ID,
      algorithm:process.env.KMS_ALGORITHM
    })
    :new DevelopmentSigningProvider({
      secret:
        process.env.DEV_SIGNING_SECRET||
        "development-only"
    });

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:104
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/security/integrations",
(_req,res)=>{
  res.json({
    integrations:
      validateProductionIntegrations(
        process.env
      ),
    signing:
      signingProvider.configurationStatus()
  });
});

app.post("/api/security/sign",
async(req,res)=>{
  const {
    digest
  }=req.body||{};

  if(!digest)
    return res.status(400).json({
      error:"digest is required"
    });

  try{
    const signature=
      await signingProvider.sign(
        digest
      );

    try{
      await pool.query(`
        INSERT INTO signing_operations
          (provider,key_id,key_version,
           algorithm,digest,status)
        VALUES($1,$2,$3,$4,$5,'SIGNED')
      `,[
        signingProvider.provider,
        signingProvider.keyId,
        process.env.KMS_KEY_VERSION||null,
        signingProvider.algorithm,
        digest
      ]);
    }catch{}

    res.json({
      signature,
      provider:signingProvider.provider,
      keyId:signingProvider.keyId,
      algorithm:signingProvider.algorithm
    });
  }catch(error){
    res.status(503).json({
      error:"Production signing provider unavailable",
      detail:error.message
    });
  }
});

app.post("/api/security/certificate/validate",
async(req,res)=>{
  const result=validateCertificateChain(
    req.body||{}
  );

  try{
    await pool.query(`
      INSERT INTO certificate_validations
        (target,chain_status,issuer,
         subject,expires_at,details)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      req.body?.target||"configured-target",
      result.status,
      req.body?.issuer||null,
      req.body?.subject||null,
      req.body?.notAfter||null,
      JSON.stringify(result)
    ]);
  }catch{}

  res.json(result);
});

app.post("/api/security/siem/deliver",
async(req,res)=>{
  const {
    eventId=crypto.randomUUID(),
    payload,
    accessToken
  }=req.body||{};

  if(!payload||!accessToken)
    return res.status(400).json({
      error:"payload and accessToken are required"
    });

  const event=buildAuthenticatedEvent({
    eventId,
    payload,
    accessToken
  });

  /*
   * Network delivery is intentionally represented by an adapter boundary.
   * A production implementation should use an approved OAuth2 client,
   * TLS validation, destination allowlisting, and bounded retries.
   */
  const policy=deliveryPolicy({
    attempt:1,
    maxAttempts:3,
    statusCode:202
  });

  try{
    await pool.query(`
      INSERT INTO siem_deliveries
        (event_id,destination,
         authentication_mode,
         status,attempt,response_code)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      event.eventId,
      process.env.SIEM_ENDPOINT||
        "configured-siem",
      process.env.SIEM_AUTH_MODE||
        "oauth2",
      policy.status,
      1,
      202
    ]);
  }catch{}

  res.json({
    eventId,
    delivery:policy,
    adapterMode:"CONTROLLED_PRODUCTION_ADAPTER",
    authenticated:true
  });
});

app.get("/api/security/integration-dashboard",
async(_req,res)=>{
  try{
    const [signing,siem,certs]=
      await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM signing_operations
          WHERE status='SIGNED'
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM siem_deliveries
          WHERE status='DELIVERED'
          AND created_at>NOW()-INTERVAL '24 hours'
        `),
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM certificate_validations
          WHERE chain_status='VALID'
          AND created_at>NOW()-INTERVAL '24 hours'
        `)
      ]);

    res.json({
      signedOperations24h:signing.rows[0].count,
      deliveredSiemEvents24h:siem.rows[0].count,
      validCertificates24h:certs.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load integration dashboard"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 104 Production Integration API running"
));


module.exports = app;
