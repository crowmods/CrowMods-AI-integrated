function breakerState({
  state="CLOSED",
  failureCount=0,
  successCount=0,
  now=new Date(),
  openedAt=null,
  failureThreshold=3,
  resetTimeoutMs=30000
}){
  const current=new Date(now);

  if(state==="OPEN"){
    const opened=new Date(openedAt);
    if(!Number.isNaN(opened.getTime()) &&
       current.getTime()-opened.getTime()>=resetTimeoutMs)
      return {
        state:"HALF_OPEN",
        failureCount,
        successCount
      };

    return {
      state:"OPEN",
      failureCount,
      successCount
    };
  }

  if(state==="CLOSED" &&
     failureCount>=failureThreshold)
    return {
      state:"OPEN",
      failureCount,
      successCount,
      openedAt:current.toISOString()
    };

  return {
    state,
    failureCount,
    successCount
  };
}

function recordBreakerResult({
  state,
  success,
  failureCount=0,
  successCount=0,
  failureThreshold=3,
  recoverySuccesses=2,
  now=new Date()
}){
  if(state==="OPEN")
    return {state:"OPEN",failureCount,successCount};

  if(state==="HALF_OPEN"){
    if(success && successCount+1>=recoverySuccesses)
      return {
        state:"CLOSED",
        failureCount:0,
        successCount:0
      };

    if(!success)
      return {
        state:"OPEN",
        failureCount:failureCount+1,
        successCount:0,
        openedAt:new Date(now).toISOString()
      };

    return {
      state:"HALF_OPEN",
      failureCount,
      successCount:successCount+1
    };
  }

  if(success)
    return {
      state:"CLOSED",
      failureCount:0,
      successCount:successCount+1
    };

  const nextFailures=failureCount+1;

  if(nextFailures>=failureThreshold)
    return {
      state:"OPEN",
      failureCount:nextFailures,
      successCount:0,
      openedAt:new Date(now).toISOString()
    };

  return {
    state:"CLOSED",
    failureCount:nextFailures,
    successCount
  };
}

module.exports={breakerState,recordBreakerResult};
