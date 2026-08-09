function takeoverExpiredJob({
  status,
  currentWorkerId,
  currentLeaseToken,
  currentFencingVersion,
  now=new Date(),
  newWorkerId,
  newLeaseToken
}){
  if(status!=="CLAIMED")
    return {
      status:"REJECTED",
      reason:"job_not_claimed"
    };

  if(!currentWorkerId||
     !currentLeaseToken||
     !newWorkerId||
     !newLeaseToken)
    return {
      status:"REJECTED",
      reason:"lease_identity_missing"
    };

  return {
    status:"TAKEOVER_PENDING",
    previousWorkerId:currentWorkerId,
    previousLeaseToken:currentLeaseToken,
    newWorkerId,
    newLeaseToken,
    nextFencingVersion:
      Number(currentFencingVersion)+1,
    takeoverAt:new Date(now).toISOString()
  };
}

function validateTakeover({
  leaseExpiresAt,
  now=new Date(),
  expectedFencingVersion,
  currentFencingVersion
}){
  const expiry=new Date(leaseExpiresAt);
  const current=new Date(now);

  if(Number.isNaN(expiry.getTime())||
     expiry>current)
    return {
      status:"REJECTED",
      reason:"lease_still_active"
    };

  if(expectedFencingVersion!==currentFencingVersion)
    return {
      status:"REJECTED",
      reason:"fencing_version_conflict"
    };

  return {
    status:"TAKEOVER_ALLOWED",
    nextFencingVersion:
      Number(currentFencingVersion)+1
  };
}

module.exports={
  takeoverExpiredJob,
  validateTakeover
};
