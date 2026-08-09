function evaluateRecovery({
  healthScore,
  consecutiveSuccesses=0,
  cooldownUntil=null,
  now=new Date(),
  recoveryThreshold=.8,
  requiredSuccesses=3,
  cooldownSeconds=300
}){
  const current=new Date(now);

  if(!Number.isFinite(healthScore))
    return {action:"HOLD",reason:"invalid_health_score"};

  if(cooldownUntil){
    const until=new Date(cooldownUntil);
    if(until>current)
      return {
        action:"COOLDOWN",
        cooldownUntil:until.toISOString()
      };
  }

  if(healthScore<recoveryThreshold)
    return {
      action:"COOLDOWN",
      cooldownUntil:new Date(
        current.getTime()+cooldownSeconds*1000
      ).toISOString()
    };

  if(consecutiveSuccesses<requiredSuccesses)
    return {
      action:"RECOVERING",
      reason:"waiting_for_stable_successes"
    };

  return {
    action:"STABLE",
    reason:"recovery_gate_satisfied"
  };
}

module.exports={evaluateRecovery};
