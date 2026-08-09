const crypto=require("crypto");
const {Pool}=require("pg");
const {isAlreadyProcessed}=require("./consumer");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const workerId=process.env.CONSUMER_WORKER_ID||`consumer-${crypto.randomUUID()}`;
const group=process.env.CONSUMER_GROUP||"default";
const pollMs=Number(process.env.CONSUMER_POLL_MS||5000);

async function getOffset(){
  const {rows}=await pool.query(`
    SELECT last_event_stream_id
    FROM consumer_offsets_v2
    WHERE consumer_group=$1
  `,[group]);

  return rows[0]?.last_event_stream_id||0;
}

async function processEvent(row){
  const already=await pool.query(`
    SELECT 1
    FROM processed_events
    WHERE consumer_group=$1 AND event_id=$2
  `,[group,row.event_id]);

  if(isAlreadyProcessed(already.rows[0]))
    return {skipped:true};

  // Replace this handler with the consumer's approved business logic.
  console.log(JSON.stringify({
    workerId,
    consumerGroup:group,
    eventId:row.event_id,
    eventType:row.event_type
  }));

  await pool.query(`
    INSERT INTO processed_events
      (consumer_group,event_id)
    VALUES($1,$2)
    ON CONFLICT DO NOTHING
  `,[group,row.event_id]);

  await pool.query(`
    UPDATE consumer_offsets_v2
    SET last_event_stream_id=$2,updated_at=NOW()
    WHERE consumer_group=$1
  `,[group,row.id]);

  return {skipped:false};
}

async function loop(){
  while(true){
    try{
      const offset=await getOffset();

      const {rows}=await pool.query(`
        SELECT *
        FROM event_stream
        WHERE id>$1
        ORDER BY id ASC
        LIMIT 50
      `,[offset]);

      const started=Date.now();

      for(const row of rows){
        try{
          await processEvent(row);

          await pool.query(`
            INSERT INTO event_delivery_attempts
              (event_id,consumer_group,attempt,status)
            VALUES($1,$2,1,'SUCCESS')
          `,[row.event_id,group]);
        }catch(error){
          await pool.query(`
            INSERT INTO event_delivery_attempts
              (event_id,consumer_group,attempt,status,error_message)
            VALUES($1,$2,1,'RETRY',$3)
          `,[row.event_id,group,error.message]);

          console.error("Consumer processing failed",error.message);
        }
      }

      const duration=Date.now()-started;

      await pool.query(`
        INSERT INTO consumer_metrics
          (consumer_group,metric_name,metric_value)
        VALUES
          ($1,'batch_size',$2),
          ($1,'batch_duration_ms',$3)
      `,[group,rows.length,duration]);
    }catch(error){
      console.error("Consumer worker error",error);
    }

    await new Promise(resolve=>setTimeout(resolve,pollMs));
  }
}

console.log(`Consumer worker ${workerId} / ${group} starting`);
loop();
