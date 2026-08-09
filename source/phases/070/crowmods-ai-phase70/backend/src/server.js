const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {rebalancePlan}=require("./rebalance");
const {lagSeverity,shouldAlert}=require("./lag");

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
  phase:70,
  service:"recovery-operations"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/recovery/rebalance/plan",async(req,res)=>{
  const {
    consumerGroup,
    timeoutSeconds=60
  }=req.body||{};

  if(!consumerGroup)
    return res.status(400).json({
      error:"consumerGroup is required"
    });

  try{
    const assignments=(await pool.query(`
      SELECT
        topic,
        partition_id AS "partitionId",
        consumer_group AS "consumerGroup",
        worker_id AS "workerId"
      FROM partition_assignments
      WHERE consumer_group=$1
    `,[consumerGroup])).rows;

    const workers=(await pool.query(`
      SELECT
        worker_id AS "workerId",
        status,
        active_partitions AS "activePartitions",
        last_seen_at AS "lastSeenAt"
      FROM worker_heartbeats
      WHERE consumer_group=$1
    `,[consumerGroup])).rows;

    res.json({
      plan:rebalancePlan({
        assignments,
        workers,
        timeoutMs:Number(timeoutSeconds)*1000
      })
    });
  }catch{
    res.status(500).json({error:"Could not create rebalance plan"});
  }
});

app.post("/api/recovery/rebalance/apply",async(req,res)=>{
  const {plan=[]}=req.body||{};

  if(!Array.isArray(plan))
    return res.status(400).json({error:"plan must be an array"});

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const applied=[];

    for(const item of plan){
      const {rows}=await client.query(`
        UPDATE partition_assignments
        SET worker_id=$4,
            lease_until=NOW()+INTERVAL '60 seconds'
        WHERE topic=$1
          AND partition_id=$2
          AND consumer_group=$3
          AND worker_id=$5
        RETURNING *
      `,[
        item.topic,
        item.partitionId,
        item.consumerGroup,
        item.newWorker,
        item.previousWorker
      ]);

      if(rows[0]){
        await client.query(`
          INSERT INTO rebalance_events
            (topic,partition_id,consumer_group,
             previous_worker,new_worker,reason)
          VALUES($1,$2,$3,$4,$5,$6)
        `,[
          item.topic,
          item.partitionId,
          item.consumerGroup,
          item.previousWorker,
          item.newWorker,
          item.reason||"REBALANCE"
        ]);

        applied.push(rows[0]);
      }
    }

    await client.query("COMMIT");
    res.json({applied});
  }catch(error){
    await client.query("ROLLBACK");
    res.status(500).json({error:"Could not apply rebalance"});
  }finally{
    client.release();
  }
});

app.post("/api/recovery/dlq/enqueue",async(req,res)=>{
  const {
    deadLetterId,
    consumerGroup,
    maxAttempts=3
  }=req.body||{};

  if(!deadLetterId||!consumerGroup)
    return res.status(400).json({
      error:"deadLetterId and consumerGroup are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO dlq_execution_jobs
        (dead_letter_id,consumer_group,max_attempts)
      VALUES($1,$2,$3)
      RETURNING *
    `,[deadLetterId,consumerGroup,maxAttempts]);

    res.status(201).json({job:rows[0]});
  }catch{
    res.status(500).json({error:"Could not enqueue DLQ job"});
  }
});

app.get("/api/recovery/dlq/jobs",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM dlq_execution_jobs
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({jobs:rows});
  }catch{
    res.status(500).json({error:"Could not load DLQ jobs"});
  }
});

app.post("/api/recovery/lag-alert",async(req,res)=>{
  const {
    consumerGroup,
    topic=null,
    lag,
    threshold=100
  }=req.body||{};

  if(!consumerGroup||lag===undefined)
    return res.status(400).json({
      error:"consumerGroup and lag are required"
    });

  const alert=shouldAlert(lag,threshold);

  if(!alert)
    return res.json({
      alert:false,
      lag:Number(lag),
      threshold:Number(threshold)
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO lag_alerts
        (consumer_group,topic,lag_value,threshold,severity)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      consumerGroup,
      topic,
      Number(lag),
      Number(threshold),
      lagSeverity(Number(lag),Number(threshold))
    ]);

    res.status(201).json({
      alert:true,
      lagAlert:rows[0]
    });
  }catch{
    res.status(500).json({error:"Could not create lag alert"});
  }
});

app.get("/api/recovery/observability",async(_req,res)=>{
  try{
    const [workers,alerts,jobs,rebalances]=await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM worker_heartbeats
        WHERE last_seen_at>NOW()-INTERVAL '2 minutes'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM lag_alerts
        WHERE status='OPEN'
      `),
      pool.query(`
        SELECT status,COUNT(*)::int AS count
        FROM dlq_execution_jobs
        GROUP BY status
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM rebalance_events
        WHERE created_at>NOW()-INTERVAL '1 hour'
      `)
    ]);

    res.json({
      healthyWorkers:workers.rows[0].count,
      openLagAlerts:alerts.rows[0].count,
      dlqJobs:jobs.rows,
      recentRebalances:rebalances.rows[0].count
    });
  }catch{
    res.status(500).json({error:"Could not load recovery observability"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 70 Recovery API running"
));
