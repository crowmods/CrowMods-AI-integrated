async function enqueue(pool,{jobType,entityType=null,entityId=null,payload={},availableAt=null,maxAttempts=5}){
  const {rows}=await pool.query(`
    INSERT INTO job_queue
      (job_type,entity_type,entity_id,payload,available_at,max_attempts)
    VALUES($1,$2,$3,$4,COALESCE($5,NOW()),$6)
    RETURNING *
  `,[jobType,entityType,entityId,payload,availableAt,maxAttempts]);
  return rows[0];
}

async function claim(pool,workerId){
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const {rows}=await client.query(`
      SELECT id
      FROM job_queue
      WHERE status='QUEUED'
        AND available_at<=NOW()
        AND attempts<max_attempts
      ORDER BY available_at,created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if(!rows.length){
      await client.query("COMMIT");
      return null;
    }

    const {rows:claimed}=await client.query(`
      UPDATE job_queue
      SET status='RUNNING',
          attempts=attempts+1,
          locked_at=NOW(),
          locked_by=$1
      WHERE id=$2
      RETURNING *
    `,[workerId,rows[0].id]);

    await client.query("COMMIT");
    return claimed[0];
  }catch(err){
    await client.query("ROLLBACK");
    throw err;
  }finally{
    client.release();
  }
}

async function succeed(pool,id){
  await pool.query(`
    UPDATE job_queue
    SET status='SUCCEEDED',completed_at=NOW(),locked_at=NULL,locked_by=NULL
    WHERE id=$1
  `,[id]);
}

async function fail(pool,id,error){
  await pool.query(`
    UPDATE job_queue
    SET status=CASE WHEN attempts>=max_attempts THEN 'FAILED' ELSE 'QUEUED' END,
        last_error=$2,
        available_at=CASE
          WHEN attempts>=max_attempts THEN NOW()
          ELSE NOW() + INTERVAL '30 seconds'
        END,
        locked_at=NULL,locked_by=NULL
    WHERE id=$1
  `,[id,String(error||"Unknown worker error")]);
}

module.exports={enqueue,claim,succeed,fail};
