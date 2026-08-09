function scheduleDelegation({
  delegationId,
  scheduledFor,
  runKey
}){
  const date=new Date(scheduledFor);

  if(!delegationId||
     !runKey||
     Number.isNaN(date.getTime()))
    return {
      status:"BLOCKED",
      reason:"invalid_scheduler_job"
    };

  return {
    status:"SCHEDULED",
    delegationId,
    runKey,
    scheduledFor:date.toISOString()
  };
}

function claimJob({
  job,
  workerId,
  now=new Date()
}){
  if(!job||job.status!=="SCHEDULED")
    return {
      status:"SKIPPED",
      reason:"job_not_claimable"
    };

  if(!workerId)
    return {
      status:"BLOCKED",
      reason:"worker_identity_required"
    };

  const due=new Date(job.scheduledFor);

  if(Number.isNaN(due.getTime())||
     due>new Date(now))
    return {
      status:"SKIPPED",
      reason:"job_not_due"
    };

  return {
    status:"CLAIMED",
    runKey:job.runKey,
    claimedBy:workerId
  };
}

module.exports={
  scheduleDelegation,
  claimJob
};
