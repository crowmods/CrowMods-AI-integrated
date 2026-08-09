function failoverDecision({
  activeWorkerId,
  leaseExpiresAt,
  now=new Date(),
  candidateWorkerId,
  candidateLeaseToken,
  currentFencingVersion=0,
  failoverAfterMs=0
}){
  const current=new Date(now);
  const expiry=new Date(leaseExpiresAt);

  if(!candidateWorkerId || !candidateLeaseToken)
    return {status:"REJECTED",reason:"candidate_identity_missing"};

  if(Number.isNaN(expiry.getTime()))
    return {status:"REJECTED",reason:"invalid_lease_expiry"};

  const expired=current.getTime()-expiry.getTime()>=failoverAfterMs;

  if(!expired)
    return {
      status:"ACTIVE",
      activeWorkerId,
      reason:"lease_still_valid"
    };

  return {
    status:"FAILED_OVER",
    workerId:candidateWorkerId,
    leaseToken:candidateLeaseToken,
    fencingVersion:Number(currentFencingVersion)+1
  };
}

module.exports={failoverDecision};
