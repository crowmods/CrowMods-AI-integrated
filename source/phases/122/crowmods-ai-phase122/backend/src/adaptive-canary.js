function adaptiveCanary({
  currentTraffic,
  errorRate,
  latencyRegression,
  maxErrorRate=5,
  maxLatencyRegression=20,
  minStep=1,
  maxStep=25,
  maxTraffic=100
}){
  if(!Number.isFinite(currentTraffic) ||
     currentTraffic<0 || currentTraffic>maxTraffic)
    return {decision:"HOLD",reason:"invalid_current_traffic"};

  if(errorRate>maxErrorRate ||
     latencyRegression>maxLatencyRegression)
    return {
      decision:"ROLLBACK",
      nextTraffic:0,
      reason:"health_threshold_exceeded"
    };

  const errorHeadroom=Math.max(
    0,maxErrorRate-Math.max(0,errorRate)
  );
  const latencyHeadroom=Math.max(
    0,maxLatencyRegression-Math.max(0,latencyRegression)
  );

  const health=Math.min(
    1,
    Math.min(
      errorHeadroom/Math.max(maxErrorRate,1),
      latencyHeadroom/Math.max(maxLatencyRegression,1)
    )
  );

  const step=Math.max(
    minStep,
    Math.min(
      maxStep,
      Math.round(minStep + health*(maxStep-minStep))
    )
  );

  const next=Math.min(maxTraffic,currentTraffic+step);

  if(next>=maxTraffic)
    return {
      decision:"PROMOTE",
      nextTraffic:maxTraffic,
      reason:"healthy_full_traffic_gate"
    };

  return {
    decision:"ADVANCE",
    nextTraffic:next,
    step,
    reason:"adaptive_health_based_progression"
  };
}

module.exports={adaptiveCanary};
