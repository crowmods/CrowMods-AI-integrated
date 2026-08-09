function renewLease({
  workerId,
  expectedWorkerId,
  leaseToken,
  expectedLeaseToken,
  expectedFencingVersion,
  currentFencingVersion,
  leaseExpiresAt,
  now=new Date(),
  extensionMs=60000
}){
  const expiry=new Date(leaseExpiresAt);
  const current=new Date(now);

  if(workerId!==expectedWorkerId ||
     leaseToken!==expectedLeaseToken)
    return {status:"REJECTED",reason:"identity_mismatch"};

  if(Number(currentFencingVersion)!==
     Number(expectedFencingVersion))
    return {status:"CONFLICT",reason:"fencing_version_mismatch"};

  if(Number.isNaN(expiry.getTime()) || expiry<=current)
    return {status:"EXPIRED",reason:"lease_expired"};

  return {
    status:"RENEWED",
    fencingVersion:Number(expectedFencingVersion),
    leaseExpiresAt:new Date(
      current.getTime()+extensionMs
    ).toISOString()
  };
}

module.exports={renewLease};
