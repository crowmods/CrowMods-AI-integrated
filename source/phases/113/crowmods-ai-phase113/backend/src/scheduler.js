const JOB_STATES=new Set([
  "SCHEDULED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "SKIPPED"
]);

function createIdempotencyKey({
  controlId,
  scheduledFor
}){
  return `${controlId}:${new Date(
    scheduledFor
  ).toISOString()}`;
}

function claimJob(job){
  if(!job||!JOB_STATES.has(job.status))
    return {
      status:"BLOCKED",
      reason:"invalid_job"
    };

  if(job.status!=="SCHEDULED")
    return {
      status:"SKIPPED",
      reason:"job_not_schedulable"
    };

  return {
    status:"RUNNING",
    attempts:(job.attempts||0)+1
  };
}

function completeJob({
  success,
  error=null
}){
  return success
    ?{
      status:"SUCCEEDED",
      lastError:null
    }
    :{
      status:"FAILED",
      lastError:error||"control_test_failed"
    };
}

module.exports={
  JOB_STATES,
  createIdempotencyKey,
  claimJob,
  completeJob
};
