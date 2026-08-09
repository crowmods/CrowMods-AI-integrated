const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {lagScaleSignal}=require("./partition");

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
  phase:69,
  service:"partition-workers"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/broker/topics",async(req,res)=>{
  const {
    topic,
    partitions
  }=req.body||{};

  if(!topic||!Number.isInteger(Number(partitions))||partitions<1)
    return res.status(400).json({
      error:"topic and positive integer partitions are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO broker_topics(topic,partitions)
      VALUES($1,$2)
      ON CONFLICT(topic)
      DO UPDATE SET partitions=EXCLUDED.partitions
      RETURNING *
    `,[topic,Number(partitions)]);

    res.status(201).json({topic:rows[0]});
  }catch{
    res.status(500).json({error:"Could not register topic"});
  }
});

app.get("/api/broker/topics",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM broker_topics
      WHERE enabled=true
      ORDER BY topic
    `);

    res.json({topics:rows});
  }catch{
    res.status(500).json({error:"Could not load topics"});
  }
});

app.post("/api/broker/assignments",async(req,res)=>{
  const {
    topic,
    partitionId,
    consumerGroup,
    workerId,
    leaseSeconds=60
  }=req.body||{};

  if(!topic||!consumerGroup||!workerId||
     !Number.isInteger(Number(partitionId)))
    return res.status(400).json({
      error:"topic, partitionId, consumerGroup and workerId are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO partition_assignments
        (topic,partition_id,consumer_group,worker_id,lease_until)
      VALUES($1,$2,$3,$4,NOW()+($5 * INTERVAL '1 second'))
      ON CONFLICT(topic,partition_id,consumer_group)
      DO UPDATE SET
        worker_id=EXCLUDED.worker_id,
        lease_until=EXCLUDED.lease_until
      RETURNING *
    `,[
      topic,
      Number(partitionId),
      consumerGroup,
      workerId,
      Number(leaseSeconds)
    ]);

    res.status(201).json({assignment:rows[0]});
  }catch{
    res.status(500).json({error:"Could not assign partition"});
  }
});

app.get("/api/broker/assignments",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM partition_assignments
      WHERE lease_until>NOW()
        AND ($1='' OR consumer_group=$1)
      ORDER BY topic,partition_id
    `,[req.query.consumerGroup||""]);

    res.json({assignments:rows});
  }catch{
    res.status(500).json({error:"Could not load assignments"});
  }
});

app.post("/api/broker/offsets/commit",async(req,res)=>{
  const {
    topic,
    partitionId,
    consumerGroup,
    offset
  }=req.body||{};

  if(!topic||!consumerGroup||
     !Number.isInteger(Number(partitionId))||
     !Number.isInteger(Number(offset)))
    return res.status(400).json({
      error:"topic, partitionId, consumerGroup and integer offset are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO partition_offsets
        (topic,partition_id,consumer_group,offset_value)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(topic,partition_id,consumer_group)
      DO UPDATE SET
        offset_value=GREATEST(
          partition_offsets.offset_value,
          EXCLUDED.offset_value
        ),
        updated_at=NOW()
      RETURNING *
    `,[
      topic,
      Number(partitionId),
      consumerGroup,
      Number(offset)
    ]);

    res.json({offset:rows[0]});
  }catch{
    res.status(500).json({error:"Could not commit offset"});
  }
});

app.get("/api/broker/scaling",async(req,res)=>{
  const consumerGroup=req.query.consumerGroup||"default";

  try{
    const result=await pool.query(`
      SELECT COALESCE(SUM(
        GREATEST(0,latest_event-offset_value)
      ),0) AS total_lag,
      COUNT(*)::int AS partitions
      FROM partition_offsets p
      LEFT JOIN (
        SELECT COUNT(*)::bigint AS latest_event
        FROM event_stream
      ) latest ON TRUE
      WHERE consumer_group=$1
    `,[consumerGroup]);

    const row=result.rows[0];

    const signal=lagScaleSignal({
      totalLag:Number(row.total_lag||0),
      targetLag:Number(req.query.targetLag||100),
      currentWorkers:Number(req.query.currentWorkers||1),
      partitions:Number(row.partitions||1),
      maxWorkers:Number(req.query.maxWorkers||50)
    });

    res.json({
      consumerGroup,
      totalLag:Number(row.total_lag||0),
      signal
    });
  }catch{
    res.status(500).json({error:"Could not calculate scaling signal"});
  }
});

app.get("/api/broker/workers",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM worker_heartbeats
      ORDER BY last_seen_at DESC
    `);

    res.json({workers:rows});
  }catch{
    res.status(500).json({error:"Could not load workers"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 69 Broker Coordination API running"
));
