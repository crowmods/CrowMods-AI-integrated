const crypto=require("crypto");
const {Pool}=require("pg");
const {shouldEscalate,nextLevel,retryDelay}=require("./escalation");
const {createNotifier}=require("./notifier");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const notifier=createNotifier();
const workerId=process.env.ESCALATION_WORKER_ID||`escalation-${crypto.randomUUID()}`;
const pollMs=Number(process.env.ESCALATION_POLL_MS||5000);
const leaseSeconds=Number(process.env.ESCALATION_LEASE_SECONDS||60);

async function claimJob(){
  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const result=await client.query(`
      SELECT id
      FROM escalation_jobs
      WHERE
        (status='QUEUED' AND run_after<=NOW())
        OR
        (status='LEASED' AND lease_until<NOW())
      ORDER BY run_after,created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if(!result.rows[0]){
      await client.query("COMMIT");
      return null;
    }

    const {rows}=await client.query(`
      UPDATE escalation_jobs
      SET status='LEASED',
          worker_id=$2,
          lease_until=NOW()+($3 * INTERVAL '1 second'),
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[result.rows[0].id,workerId,leaseSeconds]);

    await client.query("COMMIT");
    return rows[0];
  }catch(error){
    await client.query("ROLLBACK");
    throw error;
  }finally{
    client.release();
  }
}

async function processJob(job){
  const incident=(await pool.query(`
    SELECT * FROM routed_incidents WHERE id=$1
  `,[job.routed_incident_id])).rows[0];

  if(!incident)throw new Error("Incident not found");

  if(incident.status==="RESOLVED"){
    await pool.query(`
      UPDATE escalation_jobs
      SET status='CANCELLED',updated_at=NOW()
      WHERE id=$1
    `,[job.id]);
    return;
  }

  const eligible=shouldEscalate({
    status:incident.status,
    acknowledgedAt:incident.acknowledged_at,
    lastNotifiedAt:incident.last_notified_at,
    ackTimeoutMs:Number(process.env.ACK_TIMEOUT_MS||600000)
  });

  if(!eligible){
    await pool.query(`
      UPDATE escalation_jobs
      SET status='WAITING',
          run_after=NOW()+($2 * INTERVAL '1 second'),
          lease_until=NULL,
          updated_at=NOW()
      WHERE id=$1
    `,[job.id,Number(process.env.RECHECK_SECONDS||60)]);
    return;
  }

  const level=nextLevel(
    incident.escalation_level,
    Number(process.env.MAX_ESCALATION_LEVEL||3)
  );

  if(level===null){
    await pool.query(`
      INSERT INTO incident_events
        (routed_incident_id,event_type,message)
      VALUES($1,'COMMANDER_ESCALATION',
        'Maximum escalation reached; incident commander notification required')
    `,[incident.id]);

    await pool.query(`
      UPDATE escalation_jobs
      SET status='SUCCEEDED',lease_until=NULL,updated_at=NOW()
      WHERE id=$1
    `,[job.id]);
    return;
  }

  const delivery=await notifier.send({
    incidentId:incident.id,
    service:incident.service,
    severity:incident.severity,
    escalationLevel:level
  });

  await pool.query(`
    INSERT INTO notification_deliveries
      (routed_incident_id,provider,severity,status,
       attempts,provider_ref,sent_at)
    VALUES($1,$2,$3,$4,1,$5,NOW())
  `,[
    incident.id,
    delivery.provider,
    incident.severity,
    delivery.accepted?"SENT":"FAILED",
    delivery.providerRef||null
  ]);

  await pool.query(`
    UPDATE routed_incidents
    SET status='ESCALATED',
        escalation_level=$2,
        last_notified_at=NOW(),
        updated_at=NOW()
    WHERE id=$1
  `,[incident.id,level]);

  await pool.query(`
    INSERT INTO incident_events
      (routed_incident_id,event_type,message,metadata)
    VALUES($1,'ESCALATED',$2,$3)
  `,[
    incident.id,
    `Escalated to level ${level}`,
    {level,workerId}
  ]);

  await pool.query(`
    UPDATE escalation_jobs
    SET status='SUCCEEDED',lease_until=NULL,updated_at=NOW()
    WHERE id=$1
  `,[job.id]);
}

async function failJob(job,error){
  const attempts=Number(job.attempts)+1;

  if(attempts>=Number(job.max_attempts)){
    await pool.query(`
      UPDATE escalation_jobs
      SET status='FAILED',
          attempts=$2,
          last_error=$3,
          lease_until=NULL,
          updated_at=NOW()
      WHERE id=$1
    `,[job.id,attempts,error.message]);
    return;
  }

  const delay=retryDelay(attempts);

  await pool.query(`
    UPDATE escalation_jobs
    SET status='QUEUED',
        attempts=$2,
        run_after=NOW()+($3 * INTERVAL '1 millisecond'),
        last_error=$4,
        lease_until=NULL,
        updated_at=NOW()
    WHERE id=$1
  `,[job.id,attempts,delay,error.message]);
}

async function loop(){
  while(true){
    try{
      const job=await claimJob();

      if(job){
        try{
          await processJob(job);
        }catch(error){
          console.error("Escalation job failed",error);
          await failJob(job,error);
        }
      }
    }catch(error){
      console.error("Escalation worker error",error);
    }

    await new Promise(resolve=>setTimeout(resolve,pollMs));
  }
}

console.log(`Escalation worker ${workerId} starting`);
loop();
