const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  digest,
  chainHash,
  verifyDigest,
  verifyChain
}=require("./integrity");
const {
  MockIncidentProvider,
  MockSLOProvider
}=require("./providers");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const incidentProvider=new MockIncidentProvider();
const sloProvider=new MockSLOProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:77,
  service:"audit-integrity"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/audit/sign-evidence",async(req,res)=>{
  const {
    evidenceId,
    incidentId,
    payload,
    signer="system"
  }=req.body||{};

  if(!evidenceId||!incidentId||payload===undefined)
    return res.status(400).json({
      error:"evidenceId, incidentId and payload are required"
    });

  try{
    const payloadSha256=digest(payload);

    const {rows}=await pool.query(`
      INSERT INTO signed_evidence
        (evidence_id,incident_id,canonical_payload,
         payload_sha256,signer)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(evidence_id)
      DO NOTHING
      RETURNING *
    `,[
      evidenceId,
      incidentId,
      JSON.stringify(payload),
      payloadSha256,
      signer
    ]);

    res.status(201).json({
      evidence:rows[0]||null,
      payloadSha256
    });
  }catch{
    res.status(500).json({
      error:"Could not sign evidence"
    });
  }
});

app.post("/api/audit/verify-evidence/:evidenceId",async(req,res)=>{
  try{
    const row=(await pool.query(`
      SELECT *
      FROM signed_evidence
      WHERE evidence_id=$1
    `,[req.params.evidenceId])).rows[0];

    if(!row)
      return res.status(404).json({
        error:"Signed evidence not found"
      });

    const payload=JSON.parse(row.canonical_payload);

    res.json({
      evidenceId:row.evidence_id,
      valid:verifyDigest(payload,row.payload_sha256)
    });
  }catch{
    res.status(500).json({
      error:"Could not verify evidence"
    });
  }
});

app.post("/api/audit/append",async(req,res)=>{
  const {
    incidentId=null,
    eventType,
    payload={},
    actor="system"
  }=req.body||{};

  if(!eventType)
    return res.status(400).json({
      error:"eventType is required"
    });

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const previous=(await client.query(`
      SELECT event_hash
      FROM immutable_audit_chain
      WHERE incident_id IS NOT DISTINCT FROM $1
      ORDER BY sequence_id DESC
      LIMIT 1
    `,[incidentId])).rows[0];

    const eventHash=chainHash({
      previousHash:previous?.event_hash||null,
      eventType,
      payload,
      actor
    });

    const {rows}=await client.query(`
      INSERT INTO immutable_audit_chain
        (incident_id,event_type,event_payload,
         previous_hash,event_hash,actor)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      incidentId,
      eventType,
      JSON.stringify(payload),
      previous?.event_hash||null,
      eventHash,
      actor
    ]);

    await client.query("COMMIT");

    res.status(201).json({record:rows[0]});
  }catch{
    await client.query("ROLLBACK");
    res.status(500).json({
      error:"Could not append audit record"
    });
  }finally{
    client.release();
  }
});

app.get("/api/audit/verify-chain/:incidentId",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM immutable_audit_chain
      WHERE incident_id=$1
      ORDER BY sequence_id ASC
    `,[req.params.incidentId]);

    res.json({
      incidentId:req.params.incidentId,
      recordCount:rows.length,
      verification:verifyChain(rows)
    });
  }catch{
    res.status(500).json({
      error:"Could not verify audit chain"
    });
  }
});

app.get("/api/audit/export/:incidentId",async(req,res)=>{
  try{
    const [evidence,audit]=await Promise.all([
      pool.query(`
        SELECT *
        FROM signed_evidence
        WHERE incident_id=$1
        ORDER BY created_at ASC
      `,[req.params.incidentId]),
      pool.query(`
        SELECT *
        FROM immutable_audit_chain
        WHERE incident_id=$1
        ORDER BY sequence_id ASC
      `,[req.params.incidentId])
    ]);

    const exportPackage={
      format:"crowmods-audit-export-v1",
      incidentId:req.params.incidentId,
      exportedAt:new Date().toISOString(),
      evidence:evidence.rows,
      audit:audit.rows
    };

    res.json(exportPackage);
  }catch{
    res.status(500).json({
      error:"Could not export audit package"
    });
  }
});

app.post("/api/providers/incident/timeline",async(req,res)=>{
  const {
    incidentId,
    summary,
    actor="system"
  }=req.body||{};

  if(!incidentId||!summary)
    return res.status(400).json({
      error:"incidentId and summary are required"
    });

  const entry={
    type:"RECOVERY_EVIDENCE",
    summary,
    actor,
    timestamp:new Date().toISOString()
  };

  const result=await incidentProvider.addTimelineEntry(
    incidentId,
    entry
  );

  res.json({entry:result});
});

app.post("/api/providers/slo/evaluate",async(req,res)=>{
  const {
    sloName,
    observed
  }=req.body||{};

  if(!sloName||observed===undefined)
    return res.status(400).json({
      error:"sloName and observed are required"
    });

  res.json(await sloProvider.evaluate(sloName,observed));
});

app.get("/api/audit/operations",async(_req,res)=>{
  try{
    const [signed,audit]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM signed_evidence
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM immutable_audit_chain
      `)
    ]);

    res.json({
      signedEvidence:signed.rows[0].count,
      auditRecords:audit.rows[0].count
    });
  }catch{
    res.status(500).json({
      error:"Could not load audit operations"
    });
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 77 Audit Integrity API running"
));
