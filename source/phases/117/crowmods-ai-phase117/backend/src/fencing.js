const crypto=require("crypto");

function issueFencingToken({
  resourceKey,
  ownerId,
  version,
  now=new Date(),
  leaseSeconds=300
}){
  if(!resourceKey||!ownerId||
     !Number.isInteger(version)||
     version<1)
    return {
      status:"BLOCKED",
      reason:"invalid_fencing_inputs"
    };

  const issued=new Date(now);

  if(Number.isNaN(issued.getTime()))
    return {
      status:"BLOCKED",
      reason:"invalid_clock"
    };

  const token=crypto
    .randomBytes(24)
    .toString("hex");

  const expires=new Date(
    issued.getTime()+
    leaseSeconds*1000
  );

  return {
    status:"ISSUED",
    resourceKey,
    ownerId,
    version,
    token,
    issuedAt:issued.toISOString(),
    expiresAt:expires.toISOString()
  };
}

function validateFencingToken({
  presentedVersion,
  currentVersion,
  tokenStatus,
  expiresAt,
  now=new Date()
}){
  if(tokenStatus!=="ACTIVE")
    return {
      valid:false,
      reason:"token_not_active"
    };

  if(presentedVersion!==currentVersion)
    return {
      valid:false,
      reason:"stale_fencing_token"
    };

  const expiry=new Date(expiresAt);
  if(Number.isNaN(expiry.getTime())||
     expiry<=new Date(now))
    return {
      valid:false,
      reason:"token_expired"
    };

  return {
    valid:true
  };
}

module.exports={
  issueFencingToken,
  validateFencingToken
};
