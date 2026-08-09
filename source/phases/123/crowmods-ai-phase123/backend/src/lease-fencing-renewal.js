function renewFencedLease({
  status,
  runKey,
  workerId,
  leaseToken,
  presentedFencingVersion,
  currentFencingVersion,
  leaseExpiresAt,
  now=new Date(),
  extensionSeconds=300
}){
  if(status!=="CLAIMED")
    return {status:"REJECTED",reason:"lease_not_claimed"};

  if(!runKey||!workerId||!leaseToken)
    return {status:"REJECTED",reason:"lease_identity_missing"};

  if(presentedFencingVersion!==currentFencingVersion)
    return {status:"REJECTED",reason:"stale_fencing_version"};

  const expiry=new Date(leaseExpiresAt);
  const current=new Date(now);

  if(Number.isNaN(expiry.getTime())||expiry<=current)
    return {status:"EXPIRED",reason:"lease_expired"};

  const nextExpiry=new Date(
    current.getTime()+extensionSeconds*1000
  );

  return {
    status:"RENEWED",
    runKey,
    workerId,
    leaseToken,
    fencingVersion:currentFencingVersion,
    newExpiry:nextExpiry.toISOString()
  };
}

module.exports={renewFencedLease};
