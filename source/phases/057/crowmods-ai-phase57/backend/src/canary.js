function evaluateCanary({
  errorRate,
  latencyMs,
  healthPassRate,
  maxErrorRate=0.02,
  maxLatencyMs=1000,
  minHealthPassRate=0.99
}){
  const checks={
    errorRate:errorRate<=maxErrorRate,
    latencyMs:latencyMs<=maxLatencyMs,
    healthPassRate:healthPassRate>=minHealthPassRate
  };

  const promote=Object.values(checks).every(Boolean);

  return {
    promote,
    action:promote?"PROMOTE":"ROLLBACK",
    checks,
    observed:{errorRate,latencyMs,healthPassRate},
    thresholds:{
      maxErrorRate,
      maxLatencyMs,
      minHealthPassRate
    }
  };
}

module.exports={evaluateCanary};
