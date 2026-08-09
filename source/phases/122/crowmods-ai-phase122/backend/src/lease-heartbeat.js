function renewLease({
  status,
  runKey,
  workerId,
  leaseToken,
  leaseExpiresAt,
  now=new Date(),
  extensionSeconds=300
}){
  if(status!=="CLAIMED")
    return {status:"REJECTED",reason:"lease_not_claimed"};

  if(!runKey||!workerId||!leaseToken)
    return {status:"REJECTED",reason:"lease_identity_missing"};

  const current=new Date(now);
  const expiry=new Date(leaseExpiresAt);

  if(Number.isNaN(expiry.getTime()) ||
     expiry<=current)
    return {status:"EXPIRED",reason:"lease_expired"};

  const newExpiry=new Date(
    current.getTime()+extensionSeconds*1000
  );

  return {
    status:"RENEWED",
    runKey,
    workerId,
    leaseToken,
    previousExpiry:expiry.toISOString(),
    newExpiry:newExpiry.toISOString()
  };
}

module.exports={renewLease};
