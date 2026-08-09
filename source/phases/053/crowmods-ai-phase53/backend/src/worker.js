const crypto=require("crypto");
const {Pool}=require("pg");
const {getTool}=require("./tools");
const {createModelProvider}=require("./model-provider");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const workerId=process.env.WORKER_ID||`worker-${crypto.randomUUID()}`;
const pollMs=Number(process.env.WORKER_POLL_MS||3000);
const leaseSeconds=Number(process.env.JOB_LEASE_SECONDS||60);
const maxAttempts=Number(process.env.MAX_ATTEMPTS||5);
const model=createModelProvider();

async function claimJob(){
  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const result=await client.query(`
      SELECT id
      FROM worker_jobs
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
      UPDATE worker_jobs
      SET status='LEASED',
          worker_id=$2,
          lease_until=NOW()+($3 * INTERVAL '1 second'),
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[result.rows[0].id,workerId,leaseSeconds]);

    await client.query("COMMIT");
    return rows[0];
  }catch(err){
    await client.query("ROLLBACK");
    throw err;
  }finally{
    client.release();
  }
}

async function processJob(job){
  const task=(await pool.query(`
    SELECT * FROM ai_workflow_tasks WHERE id=$1
  `,[job.task_id])).rows[0];

  if(!task){
    throw new Error("Task not found");
  }

  const toolName=task.input?.tool;
  const tool=getTool(toolName);

  if(!tool){
    throw new Error(`Tool not registered: ${toolName}`);
  }

  if(tool.requiresApproval && task.approval_required){
    throw new Error("Task still requires approval");
  }

  await pool.query(`
    UPDATE worker_jobs
    SET status='RUNNING',attempts=attempts+1,updated_at=NOW()
    WHERE id=$1
  `,[job.id]);

  await pool.query(`
    UPDATE ai_workflow_tasks
    SET status='RUNNING',started_at=COALESCE(started_at,NOW())
    WHERE id=$1
  `,[task.id]);

  const modelResult=await model.generate({
    taskType:task.task_type,
    context:task.input
  });

  const toolResult=await tool.execute(task.input||{});

  const result={
    model:modelResult,
    tool:toolResult
  };

  const checks={
    toolRegistered:true,
    approvalSatisfied:!tool.requiresApproval||!task.approval_required,
    resultPresent:Boolean(toolResult)
  };

  const passed=Object.values(checks).every(Boolean);

  await pool.query(`
    INSERT INTO verification_results(job_id,passed,checks,message)
    VALUES($1,$2,$3,$4)
  `,[job.id,passed,checks,passed?"Verification passed":"Verification failed"]);

  if(!passed)throw new Error("Verification failed");

  await pool.query(`
    UPDATE worker_jobs
    SET status='SUCCEEDED',result=$2,lease_until=NULL,updated_at=NOW()
    WHERE id=$1
  `,[job.id,result]);

  await pool.query(`
    UPDATE ai_workflow_tasks
    SET status='COMPLETED',output=$2,completed_at=NOW()
    WHERE id=$1
  `,[task.id,result]);

  await pool.query(`
    INSERT INTO ai_execution_events
      (workflow_id,task_id,event_type,metadata)
    VALUES($1,$2,'WORKER_COMPLETED',$3)
  `,[task.workflow_id,task.id,{workerId}]);
}

async function failJob(job,error){
  const nextAttempt=job.attempts+1;

  if(nextAttempt>=Math.min(job.max_attempts,maxAttempts)){
    await pool.query(`
      UPDATE worker_jobs
      SET status='FAILED',last_error=$2,lease_until=NULL,updated_at=NOW()
      WHERE id=$1
    `,[job.id,error.message]);

    await pool.query(`
      UPDATE ai_workflow_tasks
      SET status='FAILED',error_message=$2,completed_at=NOW()
      WHERE id=$1
    `,[job.task_id,error.message]);

    return;
  }

  const delay=Math.min(300000,1000*Math.pow(2,nextAttempt));

  await pool.query(`
    UPDATE worker_jobs
    SET status='RETRYING',
        run_after=NOW()+($2 * INTERVAL '1 millisecond'),
        lease_until=NULL,
        last_error=$3,
        updated_at=NOW()
    WHERE id=$1
  `,[job.id,delay,error.message]);

  await pool.query(`
    UPDATE worker_jobs
    SET status='QUEUED'
    WHERE id=$1
  `,[job.id]);
}

async function loop(){
  while(true){
    try{
      const job=await claimJob();

      if(job){
        try{
          await processJob(job);
          console.log("Completed",job.id);
        }catch(err){
          console.error("Job failed",job.id,err.message);
          await failJob(job,err);
        }
      }
    }catch(err){
      console.error("Worker loop error",err);
    }

    await new Promise(r=>setTimeout(r,pollMs));
  }
}

console.log(`CrowMods worker ${workerId} starting`);
loop();
