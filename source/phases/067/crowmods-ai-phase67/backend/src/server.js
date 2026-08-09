const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const crypto=require("crypto");
const {envelope,validate}=require("./schema");
const {BrokerAdapter}=require("./broker");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const broker=new BrokerAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:67,
  service:"event-platform"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/events/schemas",async(req,res)=>{
  const {
    eventType,
    schemaVersion=1,
    schema,
    compatibility="BACKWARD"
  }=req.body||{};

  if(!eventType||!schema)
    return res.status(400).json({
      error:"eventType and schema are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO event_schemas
        (event_type,schema_version,schema,compatibility)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(event_type,schema_version)
      DO UPDATE SET
        schema=EXCLUDED.schema,
        compatibility=EXCLUDED.compatibility,
        active=true
      RETURNING *
    `,[
      eventType,schemaVersion,schema,compatibility
    ]);

    res.status(201).json({schema:rows[0]});
  }catch{
    res.status(500).json({error:"Could not register schema"});
  }
});

app.get("/api/events/schemas/:eventType/:version",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM event_schemas
      WHERE event_type=$1
        AND schema_version=$2
        AND active=true
    `,[
      req.params.eventType,
      Number(req.params.version)
    ]);

    if(!rows[0])
      return res.status(404).json({error:"Schema not found"});

    res.json({schema:rows[0]});
  }catch{
    res.status(500).json({error:"Could not load schema"});
  }
});

app.post("/api/events/publish",async(req,res)=>{
  const {
    eventType,
    schemaVersion=1,
    sourceService,
    correlationId=crypto.randomUUID(),
    payload={}
  }=req.body||{};

  if(!eventType||!sourceService)
    return res.status(400).json({
      error:"eventType and sourceService are required"
    });

  try{
    const schemaResult=await pool.query(`
      SELECT schema
      FROM event_schemas
      WHERE event_type=$1
        AND schema_version=$2
        AND active=true
    `,[eventType,schemaVersion]);

    if(!schemaResult.rows[0])
      return res.status(422).json({
        error:"No active schema for event"
      });

    const event=envelope({
      eventId:crypto.randomUUID(),
      eventType,
      schemaVersion,
      sourceService,
      correlationId,
      payload
    });

    const validation=validate(
      schemaResult.rows[0].schema,
      event
    );

    if(!validation.valid)
      return res.status(422).json({
        error:"Schema validation failed",
        details:validation.errors
      });

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

    const result=await broker.publish(eventType,event);

    res.status(202).json({
      event,
      broker:result
    });
  }catch(error){
    console.error(error);
    res.status(500).json({error:"Could not publish event"});
  }
});

app.post("/api/events/replay",async(req,res)=>{
  const {
    eventId,
    consumerGroup,
    requestedBy,
    reason=""
  }=req.body||{};

  if(!eventId||!consumerGroup||!requestedBy)
    return res.status(400).json({
      error:"eventId, consumerGroup and requestedBy are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO event_replays
        (event_id,consumer_group,requested_by,reason)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[eventId,consumerGroup,requestedBy,reason]);

    res.status(202).json({replay:rows[0]});
  }catch{
    res.status(500).json({error:"Could not request replay"});
  }
});

app.get("/api/events/dlq",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM event_dead_letters
      WHERE status='PENDING'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({deadLetters:rows});
  }catch{
    res.status(500).json({error:"Could not load DLQ"});
  }
});

app.post("/api/events/dlq/:id/replay",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      UPDATE event_dead_letters
      SET status='REPLAYED',replayed_at=NOW()
      WHERE id=$1 AND status='PENDING'
      RETURNING *
    `,[req.params.id]);

    if(!rows[0])
      return res.status(404).json({
        error:"DLQ event not found or already handled"
      });

    res.json({
      replayRequested:true,
      deadLetter:rows[0]
    });
  }catch{
    res.status(500).json({error:"Could not replay DLQ event"});
  }
});

app.get("/api/events/operations",async(_req,res)=>{
  try{
    const [schemas,dlq,replays]=await Promise.all([
      pool.query(`
        SELECT event_type,schema_version,compatibility,active
        FROM event_schemas
        ORDER BY event_type,schema_version DESC
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM event_dead_letters
        WHERE status='PENDING'
      `),
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM event_replays
        GROUP BY status
      `)
    ]);

    res.json({
      schemas:schemas.rows,
      pendingDlq:dlq.rows[0].count,
      replays:replays.rows
    });
  }catch{
    res.status(500).json({error:"Could not load event operations"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 67 Event Platform API running"
));
