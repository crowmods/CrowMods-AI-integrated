const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const crypto=require("crypto");
const {EventBus}=require("./bus");
const {buildGraph,impactedServices}=require("./graph");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const bus=new EventBus();

async function persistEvent(event){
  await pool.query(`
    INSERT INTO event_stream
      (event_id,event_type,source_service,correlation_id,payload,occurred_at)
    VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(event_id) DO NOTHING
  `,[
    event.eventId,
    event.eventType,
    event.sourceService,
    event.correlationId,
    event.payload,
    event.occurredAt
  ]);
}

bus.subscribe("SERVICE_FAILED",async event=>{
  await persistEvent(event);
});

bus.subscribe("SERVICE_RECOVERED",async event=>{
  await persistEvent(event);
});

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:66,
  service:"event-streaming"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/events/publish",async(req,res)=>{
  const {
    eventType,
    sourceService,
    correlationId=crypto.randomUUID(),
    payload={}
  }=req.body||{};

  if(!eventType||!sourceService)
    return res.status(400).json({
      error:"eventType and sourceService are required"
    });

  try{
    const event=await bus.publish({
      eventType,
      sourceService,
      correlationId,
      payload
    });

    await persistEvent(event);

    res.status(202).json({event});
  }catch(error){
    console.error(error);
    res.status(500).json({error:"Could not publish event"});
  }
});

app.get("/api/events",async(req,res)=>{
  try{
    const limit=Math.min(Number(req.query.limit||100),500);

    const {rows}=await pool.query(`
      SELECT *
      FROM event_stream
      ORDER BY id DESC
      LIMIT $1
    `,[limit]);

    res.json({events:rows});
  }catch{
    res.status(500).json({error:"Could not load events"});
  }
});

app.post("/api/dependencies",async(req,res)=>{
  const {
    sourceService,
    targetService,
    dependencyType="RUNTIME",
    criticality="NORMAL"
  }=req.body||{};

  if(!sourceService||!targetService)
    return res.status(400).json({
      error:"sourceService and targetService are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO service_dependencies
        (source_service,target_service,dependency_type,criticality)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(source_service,target_service,dependency_type)
      DO UPDATE SET criticality=EXCLUDED.criticality,enabled=true
      RETURNING *
    `,[
      sourceService,targetService,dependencyType,criticality
    ]);

    res.status(201).json({dependency:rows[0]});
  }catch{
    res.status(500).json({error:"Could not create dependency"});
  }
});

app.get("/api/dependencies/graph",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT
        source_service AS "sourceService",
        target_service AS "targetService",
        dependency_type AS "dependencyType",
        criticality
      FROM service_dependencies
      WHERE enabled=true
      ORDER BY source_service,target_service
    `);

    res.json(buildGraph(rows));
  }catch{
    res.status(500).json({error:"Could not load dependency graph"});
  }
});

app.get("/api/dependencies/impact/:service",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT
        source_service AS "sourceService",
        target_service AS "targetService",
        dependency_type AS "dependencyType",
        criticality
      FROM service_dependencies
      WHERE enabled=true
    `);

    const graph=buildGraph(rows);

    res.json({
      failedService:req.params.service,
      impactedServices:impactedServices(
        graph,
        req.params.service
      )
    });
  }catch{
    res.status(500).json({error:"Could not calculate impact"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 66 Event Streaming API running"
));
