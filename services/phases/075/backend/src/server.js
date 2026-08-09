const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  sloHealthy,
  closureEligibility,
  nextIncidentState
}=require("./closure");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:75,
  service:"incident-recovery"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/incidents/:incidentId/link-recovery",async(req,res)=>{
  const {
    scalingActionId=null,
    consumerGroup
  }=req.body||{};

  if(!consumerGroup)
    return res.status(400).json({
      error:"consumerGroup is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_recovery_links
        (incident_id,scaling_action_id,consumer_group)
      VALUES($1,$2,$3)
      ON CONFLICT(incident_id)
      DO UPDATE SET
        scaling_action_id=EXCLUDED.scaling_action_id,
        consumer_group=EXCLUDED.consumer_group
      RETURNING *
    `,[
      req.params.incidentId,
      scalingActionId,
      consumerGroup
    ]);

    res.status(201).json({link:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not link incident recovery"
    });
  }
});

app.post("/api/incidents/:incidentId/slo-check",async(req,res)=>{
  const {
    sloName,
    observedValue,
    targetValue,
    direction="LOWER"
  }=req.body||{};

  if(!sloName||
     observedValue===undefined||
     targetValue===undefined)
    return res.status(400).json({
      error:"sloName, observedValue and targetValue are required"
    });

  const healthy=sloHealthy({
    observedValue,
    targetValue,
    direction
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO slo_recovery_checks
        (incident_id,slo_name,target_value,observed_value,healthy)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.incidentId,
      sloName,
      Number(targetValue),
      Number(observedValue),
      healthy
    ]);

    res.status(201).json({check:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not record SLO check"
    });
  }
});

app.post("/api/incidents/:incidentId/closure-gates",async(req,res)=>{
  const {
    recoveryVerified,
    sloVerified,
    timelineComplete,
    postmortemEvidenceComplete
  }=req.body||{};

  const result=closureEligibility({
    recoveryVerified,
    sloVerified,
    timelineComplete,
    postmortemEvidenceComplete
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_closure_gates
        (incident_id,recovery_verified,slo_verified,
         timeline_complete,postmortem_evidence_complete,
         closure_eligible)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(incident_id)
      DO UPDATE SET
        recovery_verified=EXCLUDED.recovery_verified,
        slo_verified=EXCLUDED.slo_verified,
        timeline_complete=EXCLUDED.timeline_complete,
        postmortem_evidence_complete=EXCLUDED.postmortem_evidence_complete,
        closure_eligible=EXCLUDED.closure_eligible,
        updated_at=NOW()
      RETURNING *
    `,[
      req.params.incidentId,
      result.gates.recoveryVerified,
      result.gates.sloVerified,
      result.gates.timelineComplete,
      result.gates.postmortemEvidenceComplete,
      result.eligible
    ]);

    res.json({
      gates:rows[0],
      eligible:result.eligible
    });
  }catch{
    res.status(500).json({
      error:"Could not update closure gates"
    });
  }
});

app.post("/api/incidents/:incidentId/state",async(req,res)=>{
  const {
    currentState,
    closureEligible,
    reason="Recovery evaluation",
    changedBy="system"
  }=req.body||{};

  if(!currentState)
    return res.status(400).json({
      error:"currentState is required"
    });

  const nextState=nextIncidentState({
    currentState,
    closureEligible
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_state_history
        (incident_id,previous_state,new_state,reason,changed_by)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.incidentId,
      currentState,
      nextState,
      reason,
      changedBy
    ]);

    res.json({
      transition:rows[0]
    });
  }catch{
    res.status(500).json({
      error:"Could not record incident state transition"
    });
  }
});

app.get("/api/incidents/:incidentId/recovery",async(req,res)=>{
  try{
    const [link,gates,slo,timeline]=await Promise.all([
      pool.query(`
        SELECT *
        FROM incident_recovery_links
        WHERE incident_id=$1
      `,[req.params.incidentId]),
      pool.query(`
        SELECT *
        FROM incident_closure_gates
        WHERE incident_id=$1
      `,[req.params.incidentId]),
      pool.query(`
        SELECT *
        FROM slo_recovery_checks
        WHERE incident_id=$1
        ORDER BY observed_at DESC
        LIMIT 50
      `,[req.params.incidentId]),
      pool.query(`
        SELECT *
        FROM incident_state_history
        WHERE incident_id=$1
        ORDER BY changed_at DESC
        LIMIT 50
      `,[req.params.incidentId])
    ]);

    res.json({
      recoveryLink:link.rows[0]||null,
      closureGates:gates.rows[0]||null,
      sloChecks:slo.rows,
      stateHistory:timeline.rows
    });
  }catch{
    res.status(500).json({
      error:"Could not load incident recovery data"
    });
  }
});

app.get("/api/incidents/recovery/operations",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM incident_closure_gates
      ORDER BY updated_at DESC
      LIMIT 100
    `);

    res.json({incidents:rows});
  }catch{
    res.status(500).json({
      error:"Could not load recovery operations"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 75 Incident Recovery API running"
));


module.exports = app;
