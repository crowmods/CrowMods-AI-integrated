const crypto=require("crypto");
const {Pool}=require("pg");
const {lagScaleSignal}=require("./partition");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const workerId=process.env.WORKER_ID||`partition-worker-${crypto.randomUUID()}`;
const consumerGroup=process.env.CONSUMER_GROUP||"default";
const heartbeatMs=Number(process.env.HEARTBEAT_MS||10000);

async function heartbeat(activePartitions=0){
  await pool.query(`
    INSERT INTO worker_heartbeats
      (worker_id,consumer_group,status,active_partitions,last_seen_at)
    VALUES($1,$2,'READY',$3,NOW())
    ON CONFLICT(worker_id)
    DO UPDATE SET
      consumer_group=EXCLUDED.consumer_group,
      status='READY',
      active_partitions=EXCLUDED.active_partitions,
      last_seen_at=NOW()
  `,[workerId,consumerGroup,activePartitions]);
}

async function run(){
  console.log(
    `Partition worker ${workerId} / ${consumerGroup} starting`
  );

  while(true){
    try{
      await heartbeat(0);

      // Actual broker partition assignment/fetch/commit should be supplied
      // by the production BrokerAdapter implementation.

      const lagResult=await pool.query(`
        SELECT COALESCE(SUM(
          GREATEST(0,latest_id-last_offset)
        ),0) AS total_lag
        FROM (
          SELECT
            p.partition_id,
            COALESCE(MAX(e.id),0) AS latest_id,
            COALESCE(p.offset_value,0) AS last_offset
          FROM partition_offsets p
          LEFT JOIN event_stream e ON TRUE
          WHERE p.consumer_group=$1
          GROUP BY p.partition_id,p.offset_value
        ) x
      `,[consumerGroup]);

      const totalLag=Number(
        lagResult.rows[0]?.total_lag||0
      );

      console.log(JSON.stringify({
        workerId,
        consumerGroup,
        totalLag
      }));
    }catch(error){
      console.error("Partition worker error",error);
    }

    await new Promise(resolve=>setTimeout(resolve,heartbeatMs));
  }
}

run();
