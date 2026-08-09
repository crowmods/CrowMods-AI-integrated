const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {CHECKLIST,checklistReady,evaluateSlo}=require("./operations");

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
  phase:61,
  service:"launch-operations"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.get("/api/operations/checklist-template",(_req,res)=>{
  res.json({
    items:CHECKLIST.map(([itemKey,label])=>({
      itemKey,label,required:true
    }))
  });
});

app.post("/api/operations/launch",async(req,res)=>{
  const {
    releaseVersion,
    owner=null,
    incidentCommander=null,
    environment="production",
    notes=""
  }=req.body||{};

  if(!releaseVersion)
    return res.status(400).json({error:"releaseVersion is required"});

  try{
    const client=await pool.connect();
    try{
      await client.query("BEGIN");

      const launch=(await client.query(`
        INSERT INTO launch_operations
          (release_version,environment,owner,incident_commander,notes)
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
      `,[
        releaseVersion,environment,owner,incidentCommander,notes
      ])).rows[0];

      for(const [itemKey,label] of CHECKLIST){
        await client.query(`
          INSERT INTO launch_checklist_items
            (launch_id,item_key,label)
          VALUES($1,$2,$3)
        `,[launch.id,itemKey,label]);
      }

      await client.query("COMMIT");
      res.status(201).json({launch});
    }catch(err){
      await client.query("ROLLBACK");
      throw err;
    }finally{
      client.release();
    }
  }catch{
    res.status(500).json({error:"Could not create launch operation"});
  }
});

app.get("/api/operations/launch/:id",async(req,res)=>{
  try{
    const launch=(await pool.query(`
      SELECT * FROM launch_operations WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!launch)
      return res.status(404).json({error:"Launch not found"});

    const checklist=(await pool.query(`
      SELECT * FROM launch_checklist_items
      WHERE launch_id=$1
      ORDER BY item_key
    `,[req.params.id])).rows;

    const slo=(await pool.query(`
      SELECT * FROM slo_observations
      WHERE launch_id=$1
      ORDER BY observed_at DESC
      LIMIT 100
    `,[req.params.id])).rows;

    const timeline=(await pool.query(`
      SELECT * FROM incident_timeline
      WHERE launch_id=$1
      ORDER BY created_at DESC
      LIMIT 100
    `,[req.params.id])).rows;

    res.json({
      launch,
      checklist,
      checklistReady:checklistReady(checklist),
      slo,
      timeline
    });
  }catch{
    res.status(500).json({error:"Could not load launch operation"});
  }
});

app.post("/api/operations/launch/:id/checklist",async(req,res)=>{
  const {
    itemKey,
    completed,
    evidenceRef=null,
    completedBy=null
  }=req.body||{};

  if(!itemKey)
    return res.status(400).json({error:"itemKey is required"});

  try{
    const {rows}=await pool.query(`
      UPDATE launch_checklist_items
      SET completed=$2,
          evidence_ref=$3,
          completed_by=$4,
          completed_at=CASE WHEN $2 THEN NOW() ELSE NULL END
      WHERE launch_id=$1 AND item_key=$5
      RETURNING *
    `,[
      req.params.id,
      completed===true,
      evidenceRef,
      completedBy,
      itemKey
    ]);

    if(!rows[0])
      return res.status(404).json({error:"Checklist item not found"});

    res.json({item:rows[0]});
  }catch{
    res.status(500).json({error:"Could not update checklist"});
  }
});

app.post("/api/operations/launch/:id/slo",async(req,res)=>{
  const {
    errorRate,
    latencyMs,
    healthPassRate,
    windowMinutes=15
  }=req.body||{};

  const evaluation=evaluateSlo({
    errorRate,
    latencyMs,
    healthPassRate
  });

  try{
    const checks=evaluation.checks;

    const values=[
      ["error_rate",Number(errorRate),.02,checks.errorRate],
      ["latency_ms",Number(latencyMs),1000,checks.latencyMs],
      ["health_pass_rate",Number(healthPassRate),.99,checks.healthPassRate]
    ];

    for(const [name,value,threshold,passed] of values){
      await pool.query(`
        INSERT INTO slo_observations
          (launch_id,metric_name,value,threshold,passed,window_minutes)
        VALUES($1,$2,$3,$4,$5,$6)
      `,[
        req.params.id,name,value,threshold,passed,windowMinutes
      ]);
    }

    res.json({
      evaluation,
      action:evaluation.healthy?"CONTINUE_MONITORING":"ESCALATE"
    });
  }catch{
    res.status(500).json({error:"Could not record SLO observation"});
  }
});

app.post("/api/operations/launch/:id/timeline",async(req,res)=>{
  const {
    eventType,
    message,
    actor=null
  }=req.body||{};

  if(!eventType||!message)
    return res.status(400).json({
      error:"eventType and message are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO incident_timeline
        (launch_id,event_type,message,actor)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      req.params.id,eventType,message,actor
    ]);

    res.status(201).json({event:rows[0]});
  }catch{
    res.status(500).json({error:"Could not record timeline event"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 61 Launch Operations API running"
));


module.exports = app;
