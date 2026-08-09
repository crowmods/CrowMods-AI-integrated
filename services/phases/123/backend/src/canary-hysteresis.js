function evaluateHysteresis({
  healthScore,
  consecutiveFailures=0,
  consecutiveSuccesses=0,
  rollbackThreshold=.35,
  recoveryThreshold=.8,
  rollbackFailures=2,
  recoverySuccesses=3
}){
  if(!Number.isFinite(healthScore))
    return {action:"HOLD",reason:"invalid_health_score"};

  if(healthScore<rollbackThreshold &&
     consecutiveFailures>=rollbackFailures)
    return {
      action:"ROLLBACK",
      reason:"persistent_health_failure"
    };

  if(healthScore>=recoveryThreshold &&
     consecutiveSuccesses>=recoverySuccesses)
    return {
      action:"RECOVER",
      reason:"stable_health_recovery"
    };

  if(healthScore>=recoveryThreshold)
    return {
      action:"ADVANCE",
      reason:"healthy_but_not_stabilized"
    };

  return {
    action:"HOLD",
    reason:"hysteresis_stabilization"
  };
}

module.exports={evaluateHysteresis};
