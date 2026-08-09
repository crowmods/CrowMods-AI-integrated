function acquireLease({
  job,
  workerId,
  now=new Date(),
  leaseSeconds=300
}){
  if(!job||!job.id||!workerId)
    return {
      status:"BLOCKED",
      reason:"lease_inputs_missing"
    };

  if(job.status!=="SCHEDULED")
    return {
      status:"SKIPPED",
      reason:"job_not_schedulable"
    };

  const start=new Date(now);

  if(Number.isNaN(start.getTime()))
    return {
      status:"BLOCKED",
      reason:"invalid_clock"
    };

  const leasedUntil=new Date(
    start.getTime()+
    leaseSeconds*1000
  );

  return {
    status:"ACTIVE",
    workerId,
    jobId:job.id,
    attempt:(job.attempts||0)+1,
    leasedUntil:leasedUntil.toISOString()
  };
}

function leaseExpired({
  leasedUntil,
  now=new Date()
}){
  const expiry=new Date(leasedUntil);
  const current=new Date(now);

  if(Number.isNaN(expiry.getTime())||
     Number.isNaN(current.getTime()))
    return true;

  return expiry<=current;
}

module.exports={
  acquireLease,
  leaseExpired
};
