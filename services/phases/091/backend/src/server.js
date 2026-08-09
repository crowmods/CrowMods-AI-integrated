const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  decodeJwtParts,
  validateClaims,
  selectJwksKey
}=require("./jwt");
const {JwksCache}=require("./jwks");
const {MemoryKmsProvider}=require("./kms");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const jwksCache=new JwksCache({ttlSeconds:300});
const kms=new MemoryKmsProvider({
  secret:process.env.DEV_KMS_SECRET||"development-secret"
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:91,
  service:"identity-crypto"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/identity/validate-claims",async(req,res)=>{
  const {
    token,
    issuer,
    audience
  }=req.body||{};

  if(!token||!issuer||!audience)
    return res.status(400).json({
      error:"token, issuer and audience are required"
    });

  try{
    const decoded=decodeJwtParts(token);

    const result=validateClaims({
      payload:decoded.payload,
      issuer,
      audience
    });

    await pool.query(`
      INSERT INTO token_validation_events
        (subject,issuer,audience,kid,valid,failure_reason)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      decoded.payload.sub||null,
      decoded.payload.iss||null,
      Array.isArray(decoded.payload.aud)
        ?decoded.payload.aud.join(",")
        :decoded.payload.aud||null,
      decoded.header.kid||null,
      result.valid,
      result.valid?null:result.reason
    ]);

    res.json({
      valid:result.valid,
      reason:result.reason||null,
      header:decoded.header,
      claims:{
        sub:decoded.payload.sub,
        iss:decoded.payload.iss,
        aud:decoded.payload.aud,
        exp:decoded.payload.exp
      },
      note:"Cryptographic signature verification requires the configured JWKS key and vetted JWT verifier."
    });
  }catch(error){
    res.status(400).json({
      valid:false,
      reason:error.message
    });
  }
});

app.post("/api/jwks/cache",async(req,res)=>{
  const {
    providerId,
    keys=[]
  }=req.body||{};

  if(!providerId||!Array.isArray(keys))
    return res.status(400).json({
      error:"providerId and keys are required"
    });

  jwksCache.put(
    providerId,
    keys
  );

  res.json({
    providerId,
    keyCount:keys.length
  });
});

app.post("/api/jwks/rotate",async(req,res)=>{
  const {
    providerId,
    keys=[]
  }=req.body||{};

  if(!providerId||!Array.isArray(keys))
    return res.status(400).json({
      error:"providerId and keys are required"
    });

  jwksCache.rotate(
    providerId,
    keys
  );

  res.json({
    providerId,
    rotated:true,
    keyCount:keys.length
  });
});

app.post("/api/jwks/select",async(req,res)=>{
  const {
    providerId,
    kid,
    algorithm
  }=req.body||{};

  if(!providerId||!kid||!algorithm)
    return res.status(400).json({
      error:"providerId, kid and algorithm are required"
    });

  const keys=jwksCache.get(providerId)||[];

  const key=selectJwksKey(
    keys,
    kid,
    algorithm
  );

  if(!key)
    return res.status(404).json({
      error:"Matching JWKS key not found"
    });

  res.json({key});
});

app.post("/api/audit/sign",async(req,res)=>{
  const {
    payload
  }=req.body||{};

  if(payload===undefined)
    return res.status(400).json({
      error:"payload is required"
    });

  const result=await kms.sign(
    typeof payload==="string"
      ?payload
      :JSON.stringify(payload)
  );

  res.json(result);
});

app.post("/api/audit/verify",async(req,res)=>{
  const {
    payload,
    signature
  }=req.body||{};

  if(payload===undefined||!signature)
    return res.status(400).json({
      error:"payload and signature are required"
    });

  const valid=await kms.verify(
    typeof payload==="string"
      ?payload
      :JSON.stringify(payload),
    signature
  );

  res.json({
    valid
  });
});

app.post("/api/kms/rotate",async(req,res)=>{
  const {
    secret
  }=req.body||{};

  if(!secret)
    return res.status(400).json({
      error:"secret is required"
    });

  kms.rotate(secret);

  res.json({
    rotated:true,
    health:await kms.health()
  });
});

app.get("/api/security/crypto-health",async(_req,res)=>{
  res.json({
    jwksCache:"available",
    kms:await kms.health()
  });
});

app.get("/api/security/crypto-operations",async(_req,res)=>{
  try{
    const [validations,keys,signingKeys]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM token_validation_events
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM jwks_keys
        WHERE active=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM signing_keys
        WHERE status='ACTIVE'
      `)
    ]);

    res.json({
      tokenValidations24h:validations.rows[0].count,
      activeJwksKeys:keys.rows[0].count,
      activeSigningKeys:signingKeys.rows[0].count,
      kms:await kms.health()
    });
  }catch{
    res.status(500).json({
      error:"Could not load cryptographic operations"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 91 Identity/Crypto API running"
));


module.exports = app;
