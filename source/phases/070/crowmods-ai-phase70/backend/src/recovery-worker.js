const {Pool}=require("pg");
const {replayDecision}=require("./dlq");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

async function processDlqJob(job){
  const dead=(await pool.query(`
    SELECT *
    FROM event_dead_letters
    WHERE id=$1
  `,[job.dead_letter_id])).rows[0];

  if(!dead){
    await pool.query(`
      UPDATE dlq_execution_jobs
      SET status='FAILED',
          last_error='Dead-letter record not found',
          completed_at=NOW()
      WHERE id=$1
    `,[job.id]);
    return;
  }

  const decision=replayDecision({
    status:dead.status,
    attempts:job.attempts,
    maxAttempts:job.max_attempts
  });

  if(decision==="SKIP"){
    await pool.query(`
      UPDATE dlq_execution_jobs
      SET status='CANCELLED',completed_at=NOW()
      WHERE id=$1
    `,[job.id]);
    return;
  }

  if(decision==="FAIL"){
    await pool.query(`
      UPDATE dlq_execution_jobs
      SET status='FAILED',
          last_error='Replay attempt limit reached',
          completed_at=NOW()
      WHERE id=$1
    `,[job.id]);
    return;
  }

  // Actual replay should call the approved broker adapter here.
  await pool.query(`
    UPDATE event_dead_letters
    SET status='REPLAYED',replayed_at=NOW()
    WHERE id=$1 AND status='PENDING'
  `,[dead.id]);

  await pool.query(`
    UPDATE dlq_execution_jobs
    SET status='SUCCEEDED',
        attempts=attempts+1,
        completed_at=NOW()
    WHERE id=$1
  `,[job.id]);
}

async function loop(){
  while(true){
    try{
      const {rows}=await pool.query(`
        SELECT *
        FROM dlq_execution_jobs
        WHERE status='QUEUED'
          AND run_after<=NOW()
        ORDER BY created_at
        LIMIT 20
      `);

      for(const job of rows){
        try{
          await pool.query(`
            UPDATE dlq_execution_jobs
            SET status='RUNNING'
            WHERE id=$1 AND status='QUEUED'
          `,[job.id]);

          await processDlqJob(job);
        }catch(error){
          await pool.query(`
            UPDATE dlq_execution_jobs
            SET status='FAILED',
                last_error=$2,
                completed_at=NOW()
            WHERE id=$1
          `,[job.id,error.message]);
        }
      }
    }catch(error){
      console.error("Recovery worker error",error);
    }

    await new Promise(resolve=>setTimeout(resolve,
      Number(process.env.RECOVERY_POLL_MS||5000)
    ));
  }
}

console.log("Recovery worker starting");
loop();
