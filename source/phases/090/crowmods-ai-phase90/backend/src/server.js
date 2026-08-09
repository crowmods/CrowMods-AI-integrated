const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  discoveryDocument,
  mapExternalRoles,
  validateIssuer
}=require("./oidc");
const {
  digestExport,
  signDigest,
  verifySignature
}=require("./audit-export");
const {
  correlateSecurityEvents
}=require("./security-correlation");
const {
  MemoryAppendOnlyStore
}=require("./append-only");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const appendOnly=new MemoryAppendOnlyStore();

function developmentIdentity(req){
  const subject=req.header("x-auth-subject");
  const issuer=req.header("x-auth-issuer");

  if(!subject||!issuer)
    return null;

  return {
    subject,
    issuer
  };
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:90,
  service:"security-admin"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/oidc/discovery",async(req,res)=>{
  const identity=developmentIdentity(req);

  if(!identity)
    return res.status(401).json({
      error:"Trusted identity required"
    });

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM oidc_providers
      WHERE issuer=$1
        AND enabled=true
      LIMIT 1
    `,[identity.issuer]);

    if(!rows[0])
      return res.status(404).json({
        error:"OIDC provider not configured"
      });

    const provider=rows[0];

    res.json(discoveryDocument({
      issuer:provider.issuer,
      authorizationEndpoint:
        `${provider.issuer}/authorize`,
      tokenEndpoint:
        `${provider.issuer}/token`,
      jwksUri:provider.jwks_uri
    }));
  }catch{
    res.status(500).json({
      error:"Could not load OIDC provider"
    });
  }
});

app.post("/api/oidc/providers",async(req,res)=>{
  const {
    providerName,
    issuer,
    jwksUri
  }=req.body||{};

  if(!providerName||!issuer||!jwksUri)
    return res.status(400).json({
      error:"providerName, issuer and jwksUri are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO oidc_providers
        (provider_name,issuer,jwks_uri)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      providerName,
      issuer,
      jwksUri
    ]);

    res.status(201).json({
      provider:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create OIDC provider"
    });
  }
});

app.post("/api/oidc/role-mappings",async(req,res)=>{
  const {
    issuer,
    externalRole,
    internalRole
  }=req.body||{};

  if(!issuer||!externalRole||!internalRole)
    return res.status(400).json({
      error:"issuer, externalRole and internalRole are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO identity_role_mappings
        (issuer,external_role,internal_role)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      issuer,
      externalRole,
      internalRole
    ]);

    res.status(201).json({
      mapping:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not create role mapping"
    });
  }
});

app.post("/api/oidc/map-roles",async(req,res)=>{
  const {
    issuer,
    externalRoles=[]
  }=req.body||{};

  if(!issuer||!Array.isArray(externalRoles))
    return res.status(400).json({
      error:"issuer and externalRoles are required"
    });

  try{
    const {rows}=await pool.query(`
      SELECT issuer,external_role,internal_role,enabled
      FROM identity_role_mappings
      WHERE issuer=$1
        AND enabled=true
    `,[issuer]);

    const mappings=rows.map(row=>({
      issuer:row.issuer,
      externalRole:row.external_role,
      internalRole:row.internal_role,
      enabled:row.enabled
    }));

    res.json({
      issuer,
      internalRoles:mapExternalRoles({
        issuer,
        externalRoles,
        mappings
      })
    });
  }catch{
    res.status(500).json({
      error:"Could not map roles"
    });
  }
});

app.post("/api/oidc/validate-issuer",async(req,res)=>{
  const {
    expectedIssuer,
    tokenIssuer
  }=req.body||{};

  if(!expectedIssuer||!tokenIssuer)
    return res.status(400).json({
      error:"expectedIssuer and tokenIssuer are required"
    });

  res.json({
    valid:validateIssuer({
      expectedIssuer,
      tokenIssuer
    })
  });
});

app.post("/api/audit/export",async(req,res)=>{
  const {
    secret,
    format="json",
    storageKey=`audit-export-${Date.now()}`
  }=req.body||{};

  if(!secret)
    return res.status(400).json({
      error:"secret is required"
    });

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM immutable_audit_log
      ORDER BY id ASC
      LIMIT 10000
    `);

    const digest=digestExport(rows);
    const signature=signDigest(
      digest,
      secret
    );

    const payload={
      format,
      digest,
      signature,
      eventCount:rows.length,
      events:rows
    };

    const stored=await appendOnly.append(
      storageKey,
      payload
    );

    const {rows:exports}=await pool.query(`
      INSERT INTO audit_exports
        (export_format,storage_provider,
         object_key,event_count,digest,signature)
      VALUES($1,'memory',$2,$3,$4,$5)
      RETURNING *
    `,[
      format,
      storageKey,
      rows.length,
      digest,
      signature
    ]);

    res.status(201).json({
      export:exports[0],
      storage:stored
    });
  }catch(error){
    res.status(500).json({
      error:error.message
    });
  }
});

app.post("/api/audit/verify-signature",async(req,res)=>{
  const {
    digest,
    signature,
    secret
  }=req.body||{};

  if(!digest||!signature||!secret)
    return res.status(400).json({
      error:"digest, signature and secret are required"
    });

  res.json({
    valid:verifySignature(
      digest,
      signature,
      secret
    )
  });
});

app.post("/api/security/correlate",async(req,res)=>{
  const {
    correlationKey,
    events=[]
  }=req.body||{};

  if(!correlationKey||!Array.isArray(events))
    return res.status(400).json({
      error:"correlationKey and events are required"
    });

  const result=correlateSecurityEvents(events);

  try{
    const {rows}=await pool.query(`
      INSERT INTO security_correlations
        (correlation_key,event_count,
         highest_severity,suspicious,metadata)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(correlation_key)
      DO UPDATE SET
        event_count=EXCLUDED.event_count,
        highest_severity=EXCLUDED.highest_severity,
        suspicious=EXCLUDED.suspicious,
        metadata=EXCLUDED.metadata,
        updated_at=NOW()
      RETURNING *
    `,[
      correlationKey,
      result.eventCount,
      result.highestSeverity,
      result.suspicious,
      JSON.stringify(result)
    ]);

    res.status(201).json({
      correlation:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not correlate security events"
    });
  }
});

app.get("/api/security/admin/operations",async(_req,res)=>{
  try{
    const [providers,mappings,exports,correlations]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM oidc_providers
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM identity_role_mappings
        WHERE enabled=true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM audit_exports
        WHERE status='EXPORTED'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM security_correlations
        WHERE status='OPEN'
      `)
    ]);

    res.json({
      oidcProviders:providers.rows[0].count,
      roleMappings:mappings.rows[0].count,
      auditExports:exports.rows[0].count,
      openCorrelations:correlations.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load security administration"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 90 Security Admin API running"
));
