function burnRate({
  observedErrorRate,
  allowedErrorRate
}){
  if(allowedErrorRate<=0)return Infinity;
  return Number(observedErrorRate)/Number(allowedErrorRate);
}

function evaluate({
  errorRate,
  latencyMs,
  healthRate,
  maxErrorRate=0.02,
  maxLatencyMs=1000,
  minHealthRate=0.99
}){
  const checks={
    errorRate:Number(errorRate)<=maxErrorRate,
    latencyMs:Number(latencyMs)<=maxLatencyMs,
    healthRate:Number(healthRate)>=minHealthRate
  };

  const healthy=Object.values(checks).every(Boolean);

  return {
    healthy,
    recommendation:healthy?"CONTINUE":"ALERT",
    checks,
    burnRate:burnRate({
      observedErrorRate:Number(errorRate),
      allowedErrorRate:maxErrorRate
    })
  };
}

module.exports={burnRate,evaluate};
