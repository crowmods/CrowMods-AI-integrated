function recordDependencyMetrics({
  state="CLOSED",
  requestCount=0,
  failureCount=0,
  timeoutCount=0,
  latencySamples=[]
}){
  const samples=latencySamples
    .map(Number)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);

  const total=Math.max(0,Number(requestCount));
  const failures=Math.max(0,Number(failureCount));
  const timeouts=Math.max(0,Number(timeoutCount));

  let p95=null;
  if(samples.length){
    const index=Math.min(
      samples.length-1,
      Math.ceil(samples.length*.95)-1
    );
    p95=Number(samples[index].toFixed(3));
  }

  return {
    state,
    requestCount:total,
    failureCount:failures,
    timeoutCount:timeouts,
    latencyP95Ms:p95,
    failureRate:total
      ?Number((failures/total).toFixed(5))
      :0
  };
}

function dependencyHealth({
  failureRate,
  timeoutRate,
  latencyP95Ms,
  maxFailureRate=.05,
  maxTimeoutRate=.03,
  maxLatencyP95Ms=1000
}){
  if(!Number.isFinite(failureRate))
    return {status:"UNKNOWN"};

  if(failureRate>maxFailureRate ||
     timeoutRate>maxTimeoutRate ||
     latencyP95Ms>maxLatencyP95Ms)
    return {status:"DEGRADED"};

  return {status:"HEALTHY"};
}

module.exports={recordDependencyMetrics,dependencyHealth};
