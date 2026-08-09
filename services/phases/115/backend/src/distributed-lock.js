const crypto=require("crypto");

function createLockToken(){
  return crypto.randomBytes(24).toString("hex");
}

function lockExpiry({
  now=new Date(),
  leaseSeconds=300
}){
  const start=new Date(now);

  if(Number.isNaN(start.getTime())||
     leaseSeconds<=0)
    throw new Error("invalid_lock_parameters");

  return new Date(
    start.getTime()+
    leaseSeconds*1000
  ).toISOString();
}

function canAcquireLock({
  existing,
  now=new Date()
}){
  if(!existing)
    return true;

  if(existing.status!=="HELD")
    return true;

  const expiry=new Date(existing.expiresAt);
  return Number.isNaN(expiry.getTime())||
    expiry<=new Date(now);
}

module.exports={
  createLockToken,
  lockExpiry,
  canAcquireLock
};
