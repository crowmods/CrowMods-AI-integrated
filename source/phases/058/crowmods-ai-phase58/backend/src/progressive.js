const STAGES=[
  {name:"CANARY",trafficPercent:5},
  {name:"EARLY",trafficPercent:25},
  {name:"MAJORITY",trafficPercent:50},
  {name:"FULL",trafficPercent:100}
];

function evaluateStage({
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

  return {
    promote:Object.values(checks).every(Boolean),
    checks,
    observed:{errorRate,latencyMs,healthPassRate},
    thresholds:{maxErrorRate,maxLatencyMs,minHealthPassRate}
  };
}

function nextStage(current){
  const index=STAGES.findIndex(x=>x.name===current);
  if(index<0 || index===STAGES.length-1)return null;
  return STAGES[index+1];
}

module.exports={STAGES,evaluateStage,nextStage};
