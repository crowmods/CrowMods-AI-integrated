const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  hash,newSessionToken,permissionAllowed,requiresStepUp
}=require("./security");

const app=express();

app.use(helmet());
app.use(cors({
  origin:(process.env.TRUSTED_ORIGINS||"").split(",").filter(Boolean),
  credentials:true
}));
app.use(express.json({limit:"1mb"}));

app.use((req,res,next)=>{
  const requestId=crypto.randomUUID();
  req.requestId=requestId;
  res.setHeader("X-Request-ID",requestId);
  next();
});

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:51,
  service:"zero-trust-gateway"
}));

/*
  In production, the identity provider verifies the OIDC/OAuth token.
  This demo endpoint only models the normalized identity boundary.
*/
app.post("/api/security/identity",async(req,res)=>{
  const {
    provider,
    providerSubject,
    emailHash=null,
    mfaRequired=true
  }=req.body||{};

  if(!provider||!providerSubject)
    return res.status(400).json({
      error:"provider and providerSubject are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO identities
        (provider,provider_subject,email_hash,mfa_required,last_login_at)
      VALUES($1,$2,$3,$4,NOW())
      ON CONFLICT(provider,provider_subject)
      DO UPDATE SET
        last_login_at=NOW(),
        updated_at=NOW()
      RETURNING id,provider,provider_subject,status,mfa_required
    `,[
      provider,providerSubject,emailHash,mfaRequired
    ]);

    res.status(201).json({identity:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not normalize identity"});
  }
});

/*
  Session tokens are hashed before storage. In production, prefer the identity
  provider's secure session mechanism or a dedicated session service.
*/
app.post("/api/security/sessions",async(req,res)=>{
  const {
    identityId,
    ipAddress="",
    userAgent=""
  }=req.body||{};

  if(!identityId)
    return res.status(400).json({error:"identityId is required"});

  const token=newSessionToken();
  const ttl=Number(process.env.SESSION_TTL_SECONDS||28800);
  const expires=new Date(Date.now()+ttl*1000);

  try{
    const {rows}=await pool.query(`
      INSERT INTO sessions
        (identity_id,token_hash,ip_hash,user_agent_hash,expires_at)
      VALUES($1,$2,$3,$4,$5)
      RETURNING id,identity_id,expires_at
    `,[
      identityId,
      hash(token),
      hash(ipAddress),
      hash(userAgent),
      expires
    ]);

    /*
      The raw token is returned only once. A real web application should place
      it in a Secure + HttpOnly + SameSite cookie, not localStorage.
    */
    res.status(201).json({
      session:rows[0],
      sessionToken:token
    });
  }catch{
    res.status(500).json({error:"Could not create session"});
  }
});

async function authorization(req,res,next){
  const token=req.headers.authorization?.startsWith("Bearer ")
    ?req.headers.authorization.slice(7)
    :null;

  if(!token)
    return res.status(401).json({error:"Authentication required"});

  try{
    const {rows}=await pool.query(`
      SELECT s.id AS session_id,s.identity_id,
             i.status,i.mfa_required
      FROM sessions s
      JOIN identities i ON i.id=s.identity_id
      WHERE s.token_hash=$1
        AND s.revoked_at IS NULL
        AND s.expires_at>NOW()
    `,[hash(token)]);

    if(!rows[0]||rows[0].status!=="ACTIVE")
      return res.status(401).json({error:"Invalid or expired session"});

    req.auth=rows[0];
    next();
  }catch{
    res.status(500).json({error:"Authorization service unavailable"});
  }
}

function requirePermission(permission){
  return async(req,res,next)=>{
    await authorization(req,res,async()=>{
      try{
        /*
          Role comes from a trusted server-side role mapping, not the browser.
          This demo derives the highest role for illustration; production
          should query admin_users/admin_roles from Phase 50.
        */
        const {rows}=await pool.query(`
          SELECT ar.name AS role
          FROM admin_users au
          JOIN admin_roles ar ON ar.id=au.role_id
          WHERE au.provider_user_ref=$1
            AND au.status='ACTIVE'
          LIMIT 1
        `,[req.auth.identity_id]);

        const role=rows[0]?.role;

        const permissionRows=await pool.query(`
          SELECT permission
          FROM role_permissions
          WHERE role_name=$1
        `,[role]);

        const permissions=permissionRows.rows.map(x=>x.permission);

        if(!permissionAllowed(role,permission,permissions))
          return res.status(403).json({error:"Insufficient permission"});

        if(requiresStepUp(permission)&&req.headers["x-step-up"]!=="verified")
          return res.status(428).json({
            error:"Step-up authentication required"
          });

        next();
      }catch{
        res.status(500).json({error:"Permission check failed"});
      }
    });
  };
}

app.get("/api/security/me",authorization,async(req,res)=>{
  res.json({
    authenticated:true,
    identityId:req.auth.identity_id,
    sessionId:req.auth.session_id,
    mfaRequired:req.auth.mfa_required
  });
});

app.get("/api/security/admin-test",
  requirePermission("dashboard.read"),
  (_req,res)=>res.json({authorized:true})
);

app.post("/api/security/audit",authorization,async(req,res)=>{
  const {
    eventType,
    resourceType=null,
    resourceId=null,
    success=true,
    metadata={}
  }=req.body||{};

  if(!eventType)
    return res.status(400).json({error:"eventType is required"});

  try{
    await pool.query(`
      INSERT INTO security_events
        (identity_id,session_id,event_type,request_id,
         resource_type,resource_id,success,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    `,[
      req.auth.identity_id,
      req.auth.session_id,
      eventType,
      req.requestId,
      resourceType,
      resourceId,
      success,
      metadata
    ]);

    res.status(201).json({
      recorded:true,
      requestId:req.requestId
    });
  }catch{
    res.status(500).json({error:"Could not write security event"});
  }
});

app.post("/api/security/sessions/revoke",authorization,async(req,res)=>{
  try{
    await pool.query(`
      UPDATE sessions
      SET revoked_at=NOW()
      WHERE id=$1
    `,[req.auth.session_id]);

    res.json({revoked:true});
  }catch{
    res.status(500).json({error:"Could not revoke session"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 51 Security Gateway running"));


module.exports = app;
