const STATES=[
  "PRIMARY_HEALTHY",
  "DEGRADED",
  "FAIL_CLOSED",
  "RECOVERING"
];

function evaluateProvider({
  primaryHealthy,
  fallbackAvailable,
  securityCritical=true
}){
  if(primaryHealthy)
    return {
      state:"PRIMARY_HEALTHY",
      useFallback:false,
      allowSensitiveOperations:true
    };

  if(securityCritical){
    return {
      state:"FAIL_CLOSED",
      useFallback:false,
      allowSensitiveOperations:false
    };
  }

  if(fallbackAvailable)
    return {
      state:"DEGRADED",
      useFallback:true,
      allowSensitiveOperations:false
    };

  return {
    state:"FAIL_CLOSED",
    useFallback:false,
    allowSensitiveOperations:false
  };
}

function recoveryState({
  primaryHealthy
}){
  return primaryHealthy
    ?{
      state:"RECOVERING",
      action:"revalidate_before_restore"
    }
    :{
      state:"FAIL_CLOSED",
      action:"remain_closed"
    };
}

module.exports={
  STATES,
  evaluateProvider,
  recoveryState
};
