const DEFAULT_STAGES=[1,5,10,25,50,100];

function nextTrafficStage({
  currentPercent,
  stages=DEFAULT_STAGES,
  health={}
}){
  const ordered=stages
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);

  const current=Number(currentPercent);

  if(!ordered.length||!Number.isFinite(current))
    return {
      status:"BLOCKED",
      reason:"invalid_traffic_stages"
    };

  if(health.errorRate>health.maxErrorRate||
     health.latencyRegression>
     health.maxLatencyRegression)
    return {
      status:"ROLLBACK",
      trafficPercent:0,
      reason:"health_threshold_exceeded"
    };

  const next=ordered.find(
    percent=>percent>current
  );

  if(next===undefined)
    return {
      status:"PROMOTED",
      trafficPercent:100
    };

  return {
    status:"ADVANCE",
    trafficPercent:next
  };
}

module.exports={
  DEFAULT_STAGES,
  nextTrafficStage
};
