const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  correlationId,
  severityFromBurnRate,
  shouldCreateIncident,
  closureReady
}=require("./pipeline");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

async function event(client,correlation,eventType,service,severity,payload){
  await client.query(`
    INSERT INTO pipeline_events
      (correlation_id,event_type,service,severity,payload)
    VALUES($1,$2,$3,$4,$5)
  `,[correlation,eventType,service,severity,payload||{}]);
}

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:65,
  service:"event-pipeline"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/pipeline/evaluate-alert",async(req,res)=>{
  const {
    service="crowmods",
    alertName="slo-breach",
    healthy,
    burnRate,
    observed={}
  }=req.body||{};

  const correlation=correlationId();
  const severity=severityFromBurnRate(Number(burnRate));

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const duplicate=(await client.query(`
      SELECT id
      FROM routed_incidents
      WHERE dedupe_key=$1
        AND status<>'RESOLVED'
      LIMIT 1
    `,[`${service}:${severity}:${alertName}`])).rows[0];

    const create=shouldCreateIncident({
      healthy:Boolean(healthy),
      burnRate:Number(burnRate),
      duplicate:Boolean(duplicate)
    });

    await event(
      client,
      correlation,
      "SLO_EVALUATED",
      service,
      severity,
      {healthy,burnRate,observed}
    );

    if(!create){
      await client.query("COMMIT");
      return res.json({
        correlationId:correlation,
        action:duplicate?"DEDUPLICATED":"NO_INCIDENT",
        severity
      });
    }

    const incident=(await client.query(`
      INSERT INTO routed_incidents
        (dedupe_key,service,severity)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      `${service}:${severity}:${alertName}:${correlation}`,
      service,severity
    ])).rows[0];

    await event(
      client,
      correlation,
      "INCIDENT_CREATED",
      service,
      severity,
      {incidentId:incident.id,alertName}
    );

    const job=(await client.query(`
      INSERT INTO escalation_jobs
        (routed_incident_id)
      VALUES($1)
      RETURNING *
    `,[incident.id])).rows[0];

    await event(
      client,
      correlation,
      "ESCALATION_ENQUEUED",
      service,
      severity,
      {incidentId:incident.id,jobId:job.id}
    );

    await client.query("COMMIT");

    res.status(201).json({
      correlationId:correlation,
      action:"INCIDENT_CREATED",
      incident,
      escalationJob:job
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Pipeline evaluation failed"});
  }finally{
    client.release();
  }
});

app.get("/api/pipeline/:correlationId",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM pipeline_events
      WHERE correlation_id=$1
      ORDER BY created_at ASC
    `,[req.params.correlationId]);

    res.json({
      correlationId:req.params.correlationId,
      events:rows
    });
  }catch{
    res.status(500).json({error:"Could not load pipeline"});
  }
});

app.post("/api/pipeline/incidents/:id/postmortem",async(req,res)=>{
  const {
    summary,
    rootCause="",
    impact="",
    resolution="",
    correctiveActions=[],
    owner=null
  }=req.body||{};

  if(!summary)
    return res.status(400).json({error:"summary is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_postmortems
        (routed_incident_id,summary,root_cause,impact,
         resolution,corrective_actions,owner)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      req.params.id,
      summary,
      rootCause,
      impact,
      resolution,
      correctiveActions,
      owner
    ]);

    res.status(201).json({postmortem:rows[0]});
  }catch{
    res.status(500).json({error:"Could not create postmortem"});
  }
});

app.post("/api/pipeline/incidents/:id/closure-check",async(req,res)=>{
  const {
    resolved=true,
    timelineComplete=true,
    postmortemRequired=false,
    postmortemComplete=true
  }=req.body||{};

  res.json(closureReady({
    resolved,
    timelineComplete,
    postmortemRequired,
    postmortemComplete
  }));
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 65 Event Pipeline API running"
));
