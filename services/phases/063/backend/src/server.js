const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {escalationDecision,dedupeKey,normalizeSeverity}=require("./routing");
const {createNotifier}=require("./notifier");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const notifier=createNotifier();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:63,
  service:"oncall-routing"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/oncall/incidents",async(req,res)=>{
  const {
    incidentId=null,
    service,
    severity,
    alertName,
    message,
    assignedMember=null
  }=req.body||{};

  if(!service||!alertName||!message)
    return res.status(400).json({
      error:"service, alertName and message are required"
    });

  const normalized=normalizeSeverity(severity);
  const key=dedupeKey({
    service,
    severity:normalized,
    alertName
  });

  try{
    const client=await pool.connect();
    try{
      await client.query("BEGIN");

      const existing=(await client.query(`
        SELECT * FROM routed_incidents
        WHERE dedupe_key=$1
      `,[key])).rows[0];

      if(existing){
        await client.query("COMMIT");
        return res.json({
          deduplicated:true,
          incident:existing
        });
      }

      const incident=(await client.query(`
        INSERT INTO routed_incidents
          (incident_id,dedupe_key,service,severity,assigned_member)
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
      `,[
        incidentId,key,service,normalized,assignedMember
      ])).rows[0];

      await client.query(`
        INSERT INTO incident_events
          (routed_incident_id,event_type,message)
        VALUES($1,'CREATED',$2)
      `,[incident.id,message]);

      await client.query("COMMIT");

      await notifier.send({
        incidentId:incident.id,
        service,
        severity:normalized,
        message,
        assignedMember
      });

      res.status(201).json({
        deduplicated:false,
        incident
      });
    }catch(err){
      await client.query("ROLLBACK");
      throw err;
    }finally{
      client.release();
    }
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not route incident"});
  }
});

app.get("/api/oncall/incidents",async(req,res)=>{
  try{
    const status=req.query.status||null;
    const query=status?`
      SELECT * FROM routed_incidents
      WHERE status=$1
      ORDER BY created_at DESC
      LIMIT 100
    `:`
      SELECT * FROM routed_incidents
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const {rows}=await pool.query(query,status?[status]:[]);
    res.json({incidents:rows});
  }catch{
    res.status(500).json({error:"Could not load incidents"});
  }
});

app.post("/api/oncall/incidents/:id/acknowledge",async(req,res)=>{
  const actor=req.body?.actor||"unknown";

  try{
    const {rows}=await pool.query(`
      UPDATE routed_incidents
      SET status='ACKNOWLEDGED',
          acknowledged_at=NOW(),
          updated_at=NOW()
      WHERE id=$1 AND status<>'RESOLVED'
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({error:"Incident not found"});

    await pool.query(`
      INSERT INTO incident_events
        (routed_incident_id,event_type,message,actor)
      VALUES($1,'ACKNOWLEDGED','Incident acknowledged',$2)
    `,[req.params.id,actor]);

    res.json({incident:rows[0]});
  }catch{
    res.status(500).json({error:"Could not acknowledge incident"});
  }
});

app.post("/api/oncall/incidents/:id/escalate",async(req,res)=>{
  try{
    const incident=(await pool.query(`
      SELECT * FROM routed_incidents WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!incident)
      return res.status(404).json({error:"Incident not found"});

    const decision=escalationDecision({
      status:incident.status,
      acknowledged:incident.status==="ACKNOWLEDGED",
      escalationLevel:incident.escalation_level,
      maxEscalations:3
    });

    if(decision.action==="WAIT_FOR_RESOLUTION")
      return res.json({decision});

    const nextLevel=decision.nextLevel||
      incident.escalation_level+1;

    const {rows}=await pool.query(`
      UPDATE routed_incidents
      SET status='ESCALATED',
          escalation_level=$2,
          last_notified_at=NOW(),
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id,nextLevel]);

    await pool.query(`
      INSERT INTO incident_events
        (routed_incident_id,event_type,message,metadata)
      VALUES($1,'ESCALATED',$2,$3)
    `,[
      req.params.id,
      decision.action,
      {level:nextLevel}
    ]);

    await notifier.send({
      incidentId:incident.id,
      action:decision.action,
      escalationLevel:nextLevel
    });

    res.json({
      decision,
      incident:rows[0]
    });
  }catch{
    res.status(500).json({error:"Could not escalate incident"});
  }
});

app.post("/api/oncall/incidents/:id/resolve",async(req,res)=>{
  const actor=req.body?.actor||"unknown";
  const message=req.body?.message||"Incident resolved";

  try{
    const {rows}=await pool.query(`
      UPDATE routed_incidents
      SET status='RESOLVED',
          resolved_at=NOW(),
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({error:"Incident not found"});

    await pool.query(`
      INSERT INTO incident_events
        (routed_incident_id,event_type,message,actor)
      VALUES($1,'RESOLVED',$2,$3)
    `,[req.params.id,message,actor]);

    res.json({incident:rows[0]});
  }catch{
    res.status(500).json({error:"Could not resolve incident"});
  }
});

app.get("/api/oncall/incidents/:id/timeline",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM incident_events
      WHERE routed_incident_id=$1
      ORDER BY created_at ASC
    `,[req.params.id]);

    res.json({timeline:rows});
  }catch{
    res.status(500).json({error:"Could not load incident timeline"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 63 On-Call Routing API running"
));


module.exports = app;
