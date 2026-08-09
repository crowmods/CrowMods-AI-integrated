const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const crypto=require("crypto");
const {Pool}=require("pg");
const {
  Ed25519MemoryKeyProvider
}=require("./crypto-provider");
const {
  AppendOnlyMemoryExportAdapter,
  retentionUntil
}=require("./immutable");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const keyProvider=new Ed25519MemoryKeyProvider();
const exportAdapter=new AppendOnlyMemoryExportAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:78,
  service:"crypto-immutability"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/crypto/sign",async(req,res)=>{
  const {
    evidenceId,
    payload
  }=req.body||{};

  if(!evidenceId||payload===undefined)
    return res.status(400).json({
      error:"evidenceId and payload are required"
    });

  try{
    const canonical=JSON.stringify(payload);
    const signed=await keyProvider.sign(canonical);

    const {rows}=await pool.query(`
      INSERT INTO evidence_signatures
        (evidence_id,key_id,algorithm,key_version,signature)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      evidenceId,
      signed.keyId,
      signed.algorithm,
      signed.keyVersion,
      signed.signature
    ]);

    res.status(201).json({
      signature:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not sign evidence"
    });
  }
});

app.post("/api/crypto/verify",async(req,res)=>{
  const {
    evidenceId,
    payload
  }=req.body||{};

  if(!evidenceId||payload===undefined)
    return res.status(400).json({
      error:"evidenceId and payload are required"
    });

  try{
    const row=(await pool.query(`
      SELECT *
      FROM evidence_signatures
      WHERE evidence_id=$1
      ORDER BY signed_at DESC
      LIMIT 1
    `,[evidenceId])).rows[0];

    if(!row)
      return res.status(404).json({
        error:"Signature not found"
      });

    const valid=await keyProvider.verify(
      JSON.stringify(payload),
      row.signature,
      row.key_version
    );

    res.json({
      evidenceId,
      valid,
      keyVersion:row.key_version,
      algorithm:row.algorithm
    });
  }catch{
    res.status(500).json({
      error:"Could not verify signature"
    });
  }
});

app.post("/api/crypto/rotate",async(_req,res)=>{
  const key=keyProvider.rotate();

  try{
    await pool.query(`
      INSERT INTO signing_keys
        (key_id,key_name,key_version,algorithm,status)
      VALUES($1,$2,$3,$4,'ACTIVE')
    `,[
      key.keyId,
      "crowmods-evidence",
      key.keyVersion,
      key.algorithm
    ]);

    await pool.query(`
      UPDATE signing_keys
      SET status='RETIRED',retired_at=NOW()
      WHERE key_name='crowmods-evidence'
        AND key_version<>$1
        AND status='ACTIVE'
    `,[key.keyVersion]);

    res.json({
      keyId:key.keyId,
      keyVersion:key.keyVersion,
      algorithm:key.algorithm
    });
  }catch{
    res.status(500).json({
      error:"Could not record key rotation"
    });
  }
});

app.post("/api/immutable/export",async(req,res)=>{
  const {
    incidentId=null,
    objectKey,
    content,
    retentionDays=365
  }=req.body||{};

  if(!objectKey||content===undefined)
    return res.status(400).json({
      error:"objectKey and content are required"
    });

  const retention=retentionUntil(retentionDays);

  try{
    const result=await exportAdapter.put(
      objectKey,
      typeof content==="string"
        ?content
        :JSON.stringify(content),
      retention
    );

    const {rows}=await pool.query(`
      INSERT INTO immutable_exports
        (incident_id,object_key,content_sha256,retention_until)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      incidentId,
      objectKey,
      result.sha256,
      retention
    ]);

    res.status(201).json({
      export:rows[0]
    });
  }catch(error){
    res.status(409).json({
      error:error.message
    });
  }
});

app.get("/api/immutable/export/:objectKey",async(req,res)=>{
  const result=await exportAdapter.get(req.params.objectKey);

  if(!result)
    return res.status(404).json({
      error:"Export not found"
    });

  res.json({
    objectKey:result.objectKey,
    sha256:result.sha256,
    retentionUntil:result.retentionUntil
  });
});

app.post("/api/crypto/certify/:incidentId",async(req,res)=>{
  try{
    const [signatures,exports,audit]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM evidence_signatures
        WHERE evidence_id IN(
          SELECT id
          FROM recovery_evidence
          WHERE incident_id=$1
        )
      `,[req.params.incidentId]),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM immutable_exports
        WHERE incident_id=$1
      `,[req.params.incidentId]),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM immutable_audit_chain
        WHERE incident_id=$1
      `,[req.params.incidentId])
    ]);

    const certification={
      incidentId:req.params.incidentId,
      signedEvidence:signatures.rows[0].count,
      immutableExports:exports.rows[0].count,
      auditRecords:audit.rows[0].count,
      certified:
        signatures.rows[0].count>0 &&
        exports.rows[0].count>0 &&
        audit.rows[0].count>0,
      certifiedAt:new Date().toISOString()
    };

    res.json(certification);
  }catch{
    res.status(500).json({
      error:"Could not certify audit integrity"
    });
  }
});

app.get("/api/crypto/operations",async(_req,res)=>{
  try{
    const [keys,sigs,exports]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM signing_keys
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM evidence_signatures
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM immutable_exports
      `)
    ]);

    res.json({
      signingKeys:keys.rows[0].count,
      signatures:sigs.rows[0].count,
      immutableExports:exports.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load crypto operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 78 Crypto/Immutability API running"
));
