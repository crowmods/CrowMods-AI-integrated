const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {consumerHealth}=require("./consumer");

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
  phase:68,
  service:"consumer-workers"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/consumers",async(req,res)=>{
  const {
    name,
    topic,
    maxAttempts=5
  }=req.body||{};

  if(!name||!topic)
    return res.status(400).json({
      error:"name and topic are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO consumer_groups
        (name,topic,max_attempts)
      VALUES($1,$2,$3)
      ON CONFLICT(name)
      DO UPDATE SET
        topic=EXCLUDED.topic,
        max_attempts=EXCLUDED.max_attempts,
        enabled=true
      RETURNING *
    `,[name,topic,maxAttempts]);

    await pool.query(`
      INSERT INTO consumer_offsets_v2(consumer_group)
      VALUES($1)
      ON CONFLICT DO NOTHING
    `,[name]);

    res.status(201).json({consumer:rows[0]});
  }catch{
    res.status(500).json({error:"Could not register consumer"});
  }
});

app.get("/api/consumers",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT
        c.*,
        o.last_event_stream_id
      FROM consumer_groups c
      LEFT JOIN consumer_offsets_v2 o
        ON o.consumer_group=c.name
      ORDER BY c.name
    `);

    res.json({consumers:rows});
  }catch{
    res.status(500).json({error:"Could not load consumers"});
  }
});

app.get("/api/consumers/:group/metrics",async(req,res)=>{
  try{
    const metrics=(await pool.query(`
      SELECT *
      FROM consumer_metrics
      WHERE consumer_group=$1
      ORDER BY observed_at DESC
      LIMIT 100
    `,[req.params.group])).rows;

    const latest=(await pool.query(`
      SELECT MAX(occurred_at) AS latest_event
      FROM event_stream
    `)).rows[0];

    const processed=(await pool.query(`
      SELECT MAX(processed_at) AS last_processed
      FROM processed_events
      WHERE consumer_group=$1
    `,[req.params.group])).rows[0];

    const errorStats=(await pool.query(`
      SELECT
        COUNT(*) FILTER(WHERE status<>'SUCCESS')::float /
        NULLIF(COUNT(*),0) AS error_rate
      FROM event_delivery_attempts
      WHERE consumer_group=$1
        AND attempted_at>NOW()-INTERVAL '15 minutes'
    `,[req.params.group])).rows[0];

    const lag=latest.latest_event&&processed.last_processed
      ?Math.max(
        0,
        (Date.parse(latest.latest_event)-
         Date.parse(processed.last_processed))/1000
      )
      :null;

    res.json({
      consumerGroup:req.params.group,
      metrics,
      lagSeconds:lag,
      health:consumerHealth({
        lagSecondsValue:lag,
        errorRate:Number(errorStats.error_rate||0)
      })
    });
  }catch{
    res.status(500).json({error:"Could not load consumer metrics"});
  }
});

app.get("/api/consumers/dlq",async(_req,res)=>{
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

app.post("/api/consumers/dlq/:id/replay",async(req,res)=>{
  const requestedBy=req.body?.requestedBy||"operator";

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

    await pool.query(`
      INSERT INTO event_replays
        (event_id,consumer_group,requested_by,reason)
      VALUES($1,$2,$3,$4)
    `,[
      rows[0].event_id,
      rows[0].consumer_group,
      requestedBy,
      "DLQ replay requested"
    ]);

    res.json({
      replayRequested:true,
      deadLetter:rows[0]
    });
  }catch{
    res.status(500).json({error:"Could not request DLQ replay"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 68 Consumer API running"
));


module.exports = app;
