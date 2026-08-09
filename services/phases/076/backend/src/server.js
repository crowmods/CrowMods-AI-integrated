const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  MemoryIncidentProvider,
  MemorySLOProvider
}=require("./providers");
const {
  buildEvidence,
  packageStatus,
  approvalDecision
}=require("./evidence");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const incidentProvider=new MemoryIncidentProvider();
const sloProvider=new MemorySLOProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:76,
  service:"evidence-closure"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/evidence/collect/:incidentId",async(req,res)=>{
  const {
    evidenceType,
    source="recovery-controller",
    summary,
    payload={}
  }=req.body||{};

  if(!evidenceType||!summary)
    return res.status(400).json({
      error:"evidenceType and summary are required"
    });

  try{
    const evidence=buildEvidence({
      incidentId:req.params.incidentId,
      evidenceType,
      source,
      summary,
      payload
    });

    const {rows}=await pool.query(`
      INSERT INTO recovery_evidence
        (incident_id,evidence_type,source,summary,payload)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.incidentId,
      evidence.evidenceType,
      evidence.source,
      evidence.summary,
      JSON.stringify(evidence.payload)
    ]);

    await incidentProvider.addTimelineEntry(
      req.params.incidentId,
      {
        type:evidenceType,
        summary,
        source
      }
    );

    res.status(201).json({evidence:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not collect evidence"
    });
  }
});

app.post("/api/evidence/collect/:incidentId/slo",async(req,res)=>{
  const {
    sloName,
    observedValue
  }=req.body||{};

  if(!sloName||observedValue===undefined)
    return res.status(400).json({
      error:"sloName and observedValue are required"
    });

  try{
    const slo=await sloProvider.getSLO(sloName);

    const healthy=slo.direction==="HIGHER"
      ?Number(observedValue)>=Number(slo.target)
      :Number(observedValue)<=Number(slo.target);

    const evidence=buildEvidence({
      incidentId:req.params.incidentId,
      evidenceType:"SLO",
      source:"slo-provider",
      summary:`${sloName} recovery check`,
      payload:{
        sloName,
        target:slo.target,
        observedValue:Number(observedValue),
        direction:slo.direction,
        healthy
      }
    });

    const {rows}=await pool.query(`
      INSERT INTO recovery_evidence
        (incident_id,evidence_type,source,summary,payload)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.incidentId,
      evidence.evidenceType,
      evidence.source,
      evidence.summary,
      JSON.stringify(evidence.payload)
    ]);

    res.status(201).json({
      evidence:rows[0],
      healthy
    });
  }catch{
    res.status(500).json({
      error:"Could not collect SLO evidence"
    });
  }
});

app.post("/api/postmortem/:incidentId/build",async(req,res)=>{
  const {
    minimumEvidence=3
  }=req.body||{};

  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM recovery_evidence
      WHERE incident_id=$1
      ORDER BY collected_at ASC
    `,[req.params.incidentId]);

    const status=packageStatus(rows.length,minimumEvidence);

    const {rows:packages}=await pool.query(`
      INSERT INTO postmortem_packages
        (incident_id,evidence_count,package_status)
      VALUES($1,$2,$3)
      ON CONFLICT(incident_id)
      DO UPDATE SET
        evidence_count=EXCLUDED.evidence_count,
        package_status=EXCLUDED.package_status,
        updated_at=NOW()
      RETURNING *
    `,[
      req.params.incidentId,
      rows.length,
      status
    ]);

    res.json({
      package:packages[0],
      evidence:rows
    });
  }catch{
    res.status(500).json({
      error:"Could not build postmortem package"
    });
  }
});

app.post("/api/incidents/:incidentId/closure/request",async(req,res)=>{
  const {
    requestedBy,
    reason="Recovery verified and closure requested"
  }=req.body||{};

  if(!requestedBy)
    return res.status(400).json({
      error:"requestedBy is required"
    });

  try{
    const gates=(await pool.query(`
      SELECT *
      FROM incident_closure_gates
      WHERE incident_id=$1
    `,[req.params.incidentId])).rows[0];

    const pkg=(await pool.query(`
      SELECT *
      FROM postmortem_packages
      WHERE incident_id=$1
    `,[req.params.incidentId])).rows[0];

    const decision=approvalDecision({
      closureEligible:Boolean(gates?.closure_eligible),
      packageReady:pkg?.package_status==="READY"||
        pkg?.package_status==="APPROVED",
      requestedBy
    });

    if(!decision.allowed)
      return res.status(409).json({
        approvalRequested:false,
        reason:decision.reason
      });

    const {rows}=await pool.query(`
      INSERT INTO closure_approvals
        (incident_id,requested_by,status,reason)
      VALUES($1,$2,'PENDING',$3)
      RETURNING *
    `,[
      req.params.incidentId,
      requestedBy,
      reason
    ]);

    res.status(201).json({
      approvalRequested:true,
      approval:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not request closure approval"
    });
  }
});

app.post("/api/incidents/:incidentId/closure/approve",async(req,res)=>{
  const {
    approvedBy,
    reason="Closure approved"
  }=req.body||{};

  if(!approvedBy)
    return res.status(400).json({
      error:"approvedBy is required"
    });

  try{
    const gates=(await pool.query(`
      SELECT *
      FROM incident_closure_gates
      WHERE incident_id=$1
    `,[req.params.incidentId])).rows[0];

    const pkg=(await pool.query(`
      SELECT *
      FROM postmortem_packages
      WHERE incident_id=$1
    `,[req.params.incidentId])).rows[0];

    const decision=approvalDecision({
      closureEligible:Boolean(gates?.closure_eligible),
      packageReady:pkg?.package_status==="READY"||
        pkg?.package_status==="APPROVED",
      requestedBy:"previous-request",
      approvedBy
    });

    if(!decision.allowed)
      return res.status(409).json({
        approved:false,
        reason:decision.reason
      });

    const {rows}=await pool.query(`
      UPDATE closure_approvals
      SET status='APPROVED',
          approved_by=$2,
          reason=$3,
          decided_at=NOW()
      WHERE id=(
        SELECT id
        FROM closure_approvals
        WHERE incident_id=$1 AND status='PENDING'
        ORDER BY created_at DESC
        LIMIT 1
      )
      RETURNING *
    `,[
      req.params.incidentId,
      approvedBy,
      reason
    ]);

    if(!rows[0])
      return res.status(404).json({
        approved:false,
        reason:"No pending closure request"
      });

    res.json({
      approved:true,
      approval:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not approve closure"
    });
  }
});

app.get("/api/incidents/:incidentId/evidence",async(req,res)=>{
  try{
    const [evidence,pkg,approvals]=await Promise.all([
      pool.query(`
        SELECT *
        FROM recovery_evidence
        WHERE incident_id=$1
        ORDER BY collected_at DESC
      `,[req.params.incidentId]),
      pool.query(`
        SELECT *
        FROM postmortem_packages
        WHERE incident_id=$1
      `,[req.params.incidentId]),
      pool.query(`
        SELECT *
        FROM closure_approvals
        WHERE incident_id=$1
        ORDER BY created_at DESC
      `,[req.params.incidentId])
    ]);

    res.json({
      evidence:evidence.rows,
      postmortemPackage:pkg.rows[0]||null,
      approvals:approvals.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load evidence package"
    });
  }
});

app.get("/api/evidence/operations",async(_req,res)=>{
  try{
    const [evidence,packages,approvals]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM recovery_evidence
      `),
      pool.query(`
        SELECT package_status,COUNT(*)::int AS count
        FROM postmortem_packages
        GROUP BY package_status
      `),
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM closure_approvals
        GROUP BY status
      `)
    ]);

    res.json({
      evidenceCount:evidence.rows[0].count,
      packages:packages.rows,
      approvals:approvals.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load evidence operations"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 76 Evidence/Closure API running"
));


module.exports = app;
