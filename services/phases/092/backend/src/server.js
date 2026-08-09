const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  verifyToken
}=require("./oidc-verifier");
const {
  MemoryJwksTransport
}=require("./remote-jwks");
const {
  rolloverDiff
}=require("./rollover");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const transport=new MemoryJwksTransport();
const jwksMemory=new Map();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:92,
  service:"oidc-verifier"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/oidc/jwks/register",async(req,res)=>{
  const {
    uri,
    keys=[]
  }=req.body||{};

  if(!uri||!Array.isArray(keys))
    return res.status(400).json({
      error:"uri and keys are required"
    });

  transport.set(uri,{keys});
  jwksMemory.set(uri,keys);

  res.status(201).json({
    uri,
    keyCount:keys.length
  });
});

app.post("/api/oidc/jwks/rollover",async(req,res)=>{
  const {
    uri,
    keys=[]
  }=req.body||{};

  if(!uri||!Array.isArray(keys))
    return res.status(400).json({
      error:"uri and keys are required"
    });

  const oldKeys=jwksMemory.get(uri)||[];

  transport.set(uri,{keys});
  jwksMemory.set(uri,keys);

  const diff=rolloverDiff(
    oldKeys,
    keys
  );

  try{
    await pool.query(`
      INSERT INTO key_rollover_events
        (provider_name,old_kids,new_kids,reason)
      VALUES($1,$2,$3,$4)
    `,[
      uri,
      JSON.stringify(
        oldKeys.map(k=>k.kid)
      ),
      JSON.stringify(
        keys.map(k=>k.kid)
      ),
      "manual-development-rollover"
    ]);
  }catch{}

  res.json({
    uri,
    diff
  });
});

app.post("/api/oidc/verify",async(req,res)=>{
  const {
    token,
    issuer,
    audience,
    jwksUri,
    allowedAlgorithms=["RS256"]
  }=req.body||{};

  if(!token||!issuer||!audience||!jwksUri)
    return res.status(400).json({
      error:"token, issuer, audience and jwksUri are required"
    });

  try{
    const initialKeys=jwksMemory.get(jwksUri)||[];

    const result=await verifyToken({
      token,
      issuer,
      audience,
      allowedAlgorithms,
      keys:initialKeys,
      refreshKeys:async()=>{
        const document=await transport.fetch(
          jwksUri
        );

        jwksMemory.set(
          jwksUri,
          document.keys||[]
        );

        return document.keys||[];
      }
    });

    try{
      await pool.query(`
        INSERT INTO oidc_verification_events
          (subject,issuer,kid,algorithm,
           valid,reason,refreshed_jwks)
        VALUES($1,$2,$3,$4,$5,$6,$7)
      `,[
        result.subject||null,
        result.issuer||issuer,
        result.kid||null,
        result.algorithm||null,
        result.valid,
        result.reason||null,
        result.refreshedJwks
      ]);
    }catch{}

    if(!result.valid)
      return res.status(401).json(result);

    res.json(result);
  }catch(error){
    res.status(401).json({
      valid:false,
      reason:error.message
    });
  }
});

app.post("/api/oidc/rbac-authorize",async(req,res)=>{
  const {
    token,
    issuer,
    audience,
    jwksUri,
    requiredRole,
    roles=[]
  }=req.body||{};

  if(!token||!issuer||!audience||
     !jwksUri||!requiredRole)
    return res.status(400).json({
      error:"token, issuer, audience, jwksUri and requiredRole are required"
    });

  try{
    const initialKeys=jwksMemory.get(jwksUri)||[];

    const identity=await verifyToken({
      token,
      issuer,
      audience,
      keys:initialKeys,
      refreshKeys:async()=>{
        const document=await transport.fetch(
          jwksUri
        );

        jwksMemory.set(
          jwksUri,
          document.keys||[]
        );

        return document.keys||[];
      }
    });

    if(!identity.valid)
      return res.status(401).json(identity);

    const allowed=roles.includes(
      requiredRole
    );

    res.status(
      allowed?200:403
    ).json({
      allowed,
      subject:identity.subject,
      requiredRole
    });
  }catch(error){
    res.status(401).json({
      allowed:false,
      error:error.message
    });
  }
});

app.get("/api/security/oidc-operations",async(_req,res)=>{
  try{
    const [validations,rollovers]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM oidc_verification_events
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM key_rollover_events
        WHERE created_at>NOW()-INTERVAL '30 days'
      `)
    ]);

    res.json({
      validations24h:validations.rows[0].count,
      rollovers30d:rollovers.rows[0].count,
      cachedJwksDocuments:jwksMemory.size
    });
  }catch{
    res.status(500).json({
      error:"Could not load OIDC operations"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 92 OIDC verifier running"
));


module.exports = app;
