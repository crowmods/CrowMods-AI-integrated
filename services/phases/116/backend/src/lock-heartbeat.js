function renewLock({
  lock,
  ownerId,
  now=new Date(),
  extensionSeconds=300
}){
  if(!lock||!ownerId||
     lock.ownerId!==ownerId)
    return {
      status:"BLOCKED",
      reason:"lock_owner_mismatch"
    };

  const current=new Date(now);
  const expiry=new Date(lock.expiresAt);

  if(Number.isNaN(current.getTime())||
     Number.isNaN(expiry.getTime()))
    return {
      status:"BLOCKED",
      reason:"invalid_lock_time"
    };

  if(expiry<=current)
    return {
      status:"EXPIRED",
      reason:"lock_already_expired"
    };

  const newExpiry=new Date(
    current.getTime()+
    extensionSeconds*1000
  );

  return {
    status:"RENEWED",
    lockId:lock.id,
    ownerId,
    newExpiresAt:newExpiry.toISOString()
  };
}

function releaseLock({
  lock,
  ownerId
}){
  if(!lock||lock.ownerId!==ownerId)
    return {
      status:"BLOCKED",
      reason:"lock_owner_mismatch"
    };

  return {
    status:"RELEASED",
    lockId:lock.id
  };
}

module.exports={
  renewLock,
  releaseLock
};
