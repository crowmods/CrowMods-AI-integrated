const crypto=require("crypto");

function createLeaseToken(){
  return crypto.randomBytes(24).toString("hex");
}

function claimQueueJob({
  job,
  workerId,
  now=new Date(),
  leaseSeconds=300
}){
  if(!job||
     job.status!=="SCHEDULED")
    return {
      status:"BLOCKED",
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
      status:"BLOCKED",
      reason:"job_not_due"
    };

  const claimedAt=new Date(now);
  const expires=new Date(
    claimedAt.getTime()+
    leaseSeconds*1000
  );

  return {
    status:"CLAIMED",
    runKey:job.runKey,
    workerId,
    leaseToken:createLeaseToken(),
    claimedAt:claimedAt.toISOString(),
    leaseExpiresAt:expires.toISOString()
  };
}

function isLeaseValid({
  status,
  leaseExpiresAt,
  now=new Date()
}){
  if(status!=="CLAIMED")
    return false;

  const expiry=new Date(leaseExpiresAt);
  return Number.isFinite(expiry.getTime()) &&
    expiry>new Date(now);
}

module.exports={
  createLeaseToken,
  claimQueueJob,
  isLeaseValid
};
