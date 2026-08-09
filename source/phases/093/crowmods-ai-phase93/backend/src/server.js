const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  HardenedJwksHttpTransport
}=require("./jwks-http");
const {
  claimRoles,
  identityFromValidatedClaims
}=require("./claims");
const {
  authorizationMiddleware
}=require("./authorize");
const {
  verifyToken
}=require("./oidc-verifier");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const allowedHosts=(process.env.OIDC_JWKS_HOSTS||"")
  .split(",")
  .map(v=>v.trim())
  .filter(Boolean);

const transport=new HardenedJwksHttpTransport({
  fetchImpl:globalThis.fetch,
  allowedHosts,
  timeoutMs:5000,
  maxBytes:1024*1024
});

const memoryKeys=new Map();

async function authenticate(req,res,next){
  const authorization=req.header("authorization")||"";

  if(!authorization.startsWith("Bearer "))
    return res.status(401).json({
      error:"Bearer token required"
    });

  const token=authorization.slice(7).trim();
  const issuer=process.env.OIDC_ISSUER;
  const audience=process.env.OIDC_AUDIENCE;
  const jwksUri=process.env.OIDC_JWKS_URI;

  if(!issuer||!audience||!jwksUri)
    return res.status(503).json({
      error:"OIDC configuration unavailable"
    });

  try{
    const initialKeys=memoryKeys.get(jwksUri)||[];

    const result=await verifyToken({
      token,
      issuer,
      audience,
      keys:initialKeys,
      refreshKeys:async()=>{
        const remote=await transport.fetch(
          jwksUri
        );

        memoryKeys.set(
          jwksUri,
          remote.document.keys||[]
        );

        try{
          await pool.query(`
            INSERT INTO jwks_transport_events
              (uri,status,cache_control,
               max_age_seconds,response_bytes)
            VALUES($1,'SUCCESS',$2,$3,$4)
          `,[
            jwksUri,
            remote.cacheControl,
            remote.maxAgeSeconds,
            Buffer.byteLength(
              JSON.stringify(remote.document),
              "utf8"
            )
          ]);
        }catch{}

        return remote.document.keys||[];
      }
    });

    if(!result.valid)
      return res.status(401).json({
        error:"Token validation failed",
        reason:result.reason
      });

    const payload={
      sub:result.subject,
      iss:result.issuer,
      aud:result.audience
    };

    const roles=claimRoles({
      payload:{
        ...payload,
        [process.env.OIDC_ROLE_CLAIM||"roles"]:
          req.header("x-development-roles")||[]
      }
    });

    req.identity=identityFromValidatedClaims({
      payload,
      roles
    });

    next();
  }catch(error){
    res.status(401).json({
      error:"Authentication failed",
      reason:error.message
    });
  }
}

async function recordAuthorization({
  request,
  decision
}){
  try{
    await pool.query(`
      INSERT INTO authorization_events
        (subject,resource,action,
         allowed,roles,reason)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[
      request.identity?.subject||null,
      request.path,
      request.method,
      decision.allowed,
      JSON.stringify(
        request.identity?.roles||[]
      ),
      decision.reason
    ]);
  }catch{}
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:93,
  service:"security-boundary"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/protected/view",
  authenticate,
  authorizationMiddleware({
    requiredRoles:["ops.viewer","ops.admin"],
    onDecision:recordAuthorization
  }),
  (req,res)=>{
    res.json({
      allowed:true,
      subject:req.identity.subject,
      roles:req.identity.roles
    });
  }
);

app.post("/api/protected/admin",
  authenticate,
  authorizationMiddleware({
    requiredRoles:["ops.admin"],
    onDecision:recordAuthorization
  }),
  (req,res)=>{
    res.json({
      allowed:true,
      action:"admin-operation",
      subject:req.identity.subject
    });
  }
);

app.get("/api/security/authorization-operations",
async(_req,res)=>{
  try{
    const [authEvents,jwksEvents]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM authorization_events
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM jwks_transport_events
        WHERE created_at>NOW()-INTERVAL '24 hours'
      `)
    ]);

    res.json({
      authorizationEvents24h:
        authEvents.rows[0].count,
      jwksTransportEvents24h:
        jwksEvents.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load authorization operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 93 Security Boundary API running"
));
