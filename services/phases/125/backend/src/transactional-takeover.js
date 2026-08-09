function transactionalTakeover({
  jobStatus,
  leaseExpiresAt,
  now=new Date(),
  storedFencingVersion,
  expectedFencingVersion,
  newWorkerId,
  newLeaseToken,
  nextLeaseExpiresAt
}){
  if(jobStatus!=="CLAIMED")
    return {
      status:"REJECTED",
      reason:"job_not_claimed"
    };

  const expiry=new Date(leaseExpiresAt);
  const current=new Date(now);

  if(Number.isNaN(expiry.getTime())||
     expiry>current)
    return {
      status:"REJECTED",
      reason:"lease_still_active"
    };

  if(storedFencingVersion!==expectedFencingVersion)
    return {
      status:"CONFLICT",
      reason:"fencing_version_conflict"
    };

  if(!newWorkerId||!newLeaseToken||
     !nextLeaseExpiresAt)
    return {
      status:"REJECTED",
      reason:"new_lease_identity_missing"
    };

  return {
    status:"TAKEN_OVER",
    newFencingVersion:
      Number(storedFencingVersion)+1,
    newWorkerId,
    newLeaseToken,
    leaseExpiresAt:nextLeaseExpiresAt
  };
}

module.exports={transactionalTakeover};
