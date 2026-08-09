const REQUIRED_EVIDENCE=[
  "ci",
  "tests",
  "security",
  "artifact",
  "staging",
  "backup",
  "canary",
  "approval"
];

const ROLLOUT_STAGES=[
  {name:"CANARY",trafficPercent:5},
  {name:"EARLY",trafficPercent:25},
  {name:"MAJORITY",trafficPercent:50},
  {name:"FULL",trafficPercent:100}
];

function launchReady(evidence={}){
  const checks=Object.fromEntries(
    REQUIRED_EVIDENCE.map(k=>[k,evidence[k]===true])
  );

  return {
    ready:Object.values(checks).every(Boolean),
    checks,
    missing:REQUIRED_EVIDENCE.filter(k=>!checks[k])
  };
}

function nextStage(stage){
  const i=ROLLOUT_STAGES.findIndex(x=>x.name===stage);
  return i>=0 && i<ROLLOUT_STAGES.length-1
    ?ROLLOUT_STAGES[i+1]
    :null;
}

function rolloutDecision(metrics){
  const errorRate=Number(metrics.errorRate);
  const latencyMs=Number(metrics.latencyMs);
  const healthPassRate=Number(metrics.healthPassRate);

  const checks={
    errorRate:errorRate<=0.02,
    latencyMs:latencyMs<=1000,
    healthPassRate:healthPassRate>=0.99
  };

  return {
    promote:Object.values(checks).every(Boolean),
    checks,
    observed:{errorRate,latencyMs,healthPassRate}
  };
}

module.exports={
  REQUIRED_EVIDENCE,
  ROLLOUT_STAGES,
  launchReady,
  nextStage,
  rolloutDecision
};
