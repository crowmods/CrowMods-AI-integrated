function validateLease({
 ownerId,
 expectedOwnerId,
 leaseToken,
 expectedLeaseToken,
 fencingVersion,
 expectedFencingVersion,
 leaseExpiresAt,
 now=new Date()
}){
 const expiry=new Date(leaseExpiresAt);
 if(ownerId!==expectedOwnerId ||
    leaseToken!==expectedLeaseToken ||
    Number(fencingVersion)!==Number(expectedFencingVersion))
   return {status:"CONFLICT",reason:"lease_fence_mismatch"};

 if(Number.isNaN(expiry.getTime())||expiry<=new Date(now))
   return {status:"EXPIRED",reason:"lease_expired"};

 return {status:"VALID"};
}

module.exports={validateLease};
