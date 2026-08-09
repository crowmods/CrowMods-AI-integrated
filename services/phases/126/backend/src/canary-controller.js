const STAGES=[0,1,5,10,25,50,100];

function canaryRecoveryController({
  state="ROLLBACK",
  currentStage=0,
  healthScore,
  consecutiveSuccesses=0,
  requiredSuccesses=3
}){
  if(!Number.isFinite(healthScore))
    return {
      state:"ROLLBACK",
      stage:0,
      trafficPercent:0,
      reason:"invalid_health"
    };

  if(healthScore<.5)
    return {
      state:"ROLLBACK",
      stage:0,
      trafficPercent:0,
      reason:"health_below_recovery_floor"
    };

  if(state==="ROLLBACK" ||
     state==="RECOVERY"){
    if(consecutiveSuccesses<requiredSuccesses)
      return {
        state:"RECOVERY",
        stage:currentStage,
        trafficPercent:STAGES[currentStage]||0,
        reason:"waiting_for_stable_health"
      };

    const nextStage=Math.min(
      STAGES.length-1,
      currentStage+1
    );

    if(nextStage===STAGES.length-1)
      return {
        state:"STABLE",
        stage:nextStage,
        trafficPercent:100,
        reason:"full_traffic_recovered"
      };

    return {
      state:"RECOVERY",
      stage:nextStage,
      trafficPercent:STAGES[nextStage],
      reason:"recovery_stage_advanced"
    };
  }

  if(state==="STABLE" && healthScore<.65)
    return {
      state:"RECOVERY",
      stage:Math.max(1,currentStage-1),
      trafficPercent:
        STAGES[Math.max(1,currentStage-1)],
      reason:"stable_state_degraded"
    };

  return {
    state:"STABLE",
    stage:currentStage,
    trafficPercent:STAGES[currentStage]||100,
    reason:"stable"
  };
}

module.exports={STAGES,canaryRecoveryController};
