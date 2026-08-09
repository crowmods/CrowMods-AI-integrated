const STAGES=[
  "PRECHECK",
  "CANARY",
  "OBSERVE",
  "PROMOTING",
  "PROMOTED",
  "ROLLING_BACK",
  "ROLLED_BACK",
  "FAILED"
];

function transition({
  stage,
  checks={},
  trafficPercent=1,
  errorRate=0,
  latencyRegression=0,
  thresholds={
    maxErrorRate:5,
    maxLatencyRegression:20
  }
}){
  if(!STAGES.includes(stage))
    return {
      status:"FAILED",
      reason:"unknown_rollout_stage"
    };

  const required=[
    "schemaValid",
    "dependenciesHealthy",
    "rollbackReady",
    "observabilityReady"
  ];

  const failed=required.filter(
    key=>checks[key]!==true
  );

  if(stage==="PRECHECK"){
    if(failed.length)
      return {
        stage:"FAILED",
        reason:"precheck_failed"
      };

    return {
      stage:"CANARY",
      trafficPercent:Math.max(1,trafficPercent)
    };
  }

  if(stage==="CANARY")
    return {
      stage:"OBSERVE",
      trafficPercent
    };

  if(stage==="OBSERVE"){
    if(errorRate>thresholds.maxErrorRate||
       latencyRegression>
       thresholds.maxLatencyRegression)
      return {
        stage:"ROLLING_BACK",
        reason:"health_threshold_exceeded"
      };

    return {
      stage:"PROMOTING",
      trafficPercent:100
    };
  }

  if(stage==="PROMOTING")
    return {
      stage:"PROMOTED",
      trafficPercent:100
    };

  if(stage==="ROLLING_BACK")
    return {
      stage:"ROLLED_BACK",
      trafficPercent:0
    };

  return {
    stage,
    trafficPercent
  };
}

module.exports={
  STAGES,
  transition
};
