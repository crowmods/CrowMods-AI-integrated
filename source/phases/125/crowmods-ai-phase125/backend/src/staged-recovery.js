const DEFAULT_STAGES=[
  {stage:1,traffic:1},
  {stage:2,traffic:5},
  {stage:3,traffic:10},
  {stage:4,traffic:25},
  {stage:5,traffic:50},
  {stage:6,traffic:100}
];

function stagedRecovery({
  currentStage=0,
  consecutiveSuccesses=0,
  healthScore,
  requiredSuccesses=3,
  stages=DEFAULT_STAGES
}){
  if(!Number.isFinite(healthScore))
    return {
      state:"ROLLING_BACK",
      reason:"invalid_health_score"
    };

  if(healthScore<.5)
    return {
      state:"ROLLING_BACK",
      stage:0,
      trafficPercent:0,
      reason:"recovery_health_failed"
    };

  if(consecutiveSuccesses<requiredSuccesses)
    return {
      state:"RECOVERING",
      stage:currentStage,
      trafficPercent:
        stages.find(s=>s.stage===currentStage)?.traffic||0,
      reason:"waiting_for_stable_successes"
    };

  const next=stages.find(
    s=>s.stage>currentStage
  );

  if(!next)
    return {
      state:"STABLE",
      stage:currentStage,
      trafficPercent:100,
      reason:"recovery_complete"
    };

  return {
    state:"RECOVERING",
    stage:next.stage,
    trafficPercent:next.traffic,
    reason:"recovery_stage_advanced"
  };
}

module.exports={DEFAULT_STAGES,stagedRecovery};
