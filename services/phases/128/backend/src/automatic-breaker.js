function transitionBreaker({
  state="CLOSED",
  failureRate=0,
  timeoutRate=0,
  latencyP95Ms=0,
  now=new Date(),
  failureThreshold=.05,
  timeoutThreshold=.03,
  latencyThreshold=1000,
  halfOpenAfterMs=30000,
  openedAt=null
}){
  const current=new Date(now);

  if(state==="OPEN"){
    const opened=new Date(openedAt);
    if(!Number.isNaN(opened.getTime()) &&
       current.getTime()-opened.getTime()>=halfOpenAfterMs)
      return {
        state:"HALF_OPEN",
        reason:"reset_timeout_elapsed"
      };

    return {
      state:"OPEN",
      reason:"breaker_still_open"
    };
  }

  const degraded=
    failureRate>failureThreshold ||
    timeoutRate>timeoutThreshold ||
    latencyP95Ms>latencyThreshold;

  if(state==="CLOSED" && degraded)
    return {
      state:"OPEN",
      reason:"dependency_health_threshold_exceeded",
      openedAt:current.toISOString()
    };

  if(state==="HALF_OPEN"){
    if(degraded)
      return {
        state:"OPEN",
        reason:"half_open_probe_failed",
        openedAt:current.toISOString()
      };

    return {
      state:"CLOSED",
      reason:"half_open_probe_succeeded"
    };
  }

  return {
    state:"CLOSED",
    reason:"dependency_healthy"
  };
}

module.exports={transitionBreaker};
