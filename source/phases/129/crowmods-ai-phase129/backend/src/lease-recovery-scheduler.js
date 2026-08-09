function acquireRecoveryLease({
  currentWorkerId,
  currentLeaseToken,
  currentVersion,
  leaseExpiresAt,
  now=new Date(),
  workerId,
  leaseToken,
  leaseSeconds=60
}){
  const current=new Date(now);
  const expiry=new Date(leaseExpiresAt);

  const active=!Number.isNaN(expiry.getTime()) &&
    expiry>current;

  if(active &&
     currentWorkerId &&
     currentWorkerId!==workerId)
    return {
      status:"REJECTED",
      reason:"active_lease_owned_by_other_worker"
    };

  const nextVersion=Number(currentVersion)+1;

  return {
    status:"ACQUIRED",
    workerId,
    leaseToken,
    fencingVersion:nextVersion,
    leaseExpiresAt:new Date(
      current.getTime()+leaseSeconds*1000
    ).toISOString()
  };
}

function validateRecoveryLease({
  workerId,
  expectedWorkerId,
  leaseToken,
  expectedLeaseToken,
  fencingVersion,
  expectedFencingVersion,
  leaseExpiresAt,
  now=new Date()
}){
  const expiry=new Date(leaseExpiresAt);

  if(workerId!==expectedWorkerId ||
     leaseToken!==expectedLeaseToken ||
     Number(fencingVersion)!==
       Number(expectedFencingVersion))
    return {
      status:"REJECTED",
      reason:"lease_fence_mismatch"
    };

  if(Number.isNaN(expiry.getTime()) ||
     expiry<=new Date(now))
    return {
      status:"EXPIRED",
      reason:"lease_expired"
    };

  return {
    status:"VALID"
  };
}

module.exports={
  acquireRecoveryLease,
  validateRecoveryLease
};
