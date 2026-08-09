function persistentCooldown({
  state="ROLLBACK",
  failureStreak=0,
  recoveryStreak=0,
  cooldownUntil=null,
  healthScore,
  now=new Date(),
  failureThreshold=2,
  recoveryThreshold=.8,
  requiredRecoveryStreak=3,
  cooldownMs=300000
}){
  const current=new Date(now);

  if(!Number.isFinite(healthScore))
    return {state:"ROLLBACK",reason:"invalid_health"};

  if(state==="COOLDOWN" && cooldownUntil){
    const until=new Date(cooldownUntil);
    if(until>current)
      return {
        state:"COOLDOWN",
        cooldownUntil:until.toISOString()
      };
  }

  if(healthScore<.5){
    const nextFailures=failureStreak+1;
    if(nextFailures>=failureThreshold)
      return {
        state:"COOLDOWN",
        failureStreak:nextFailures,
        recoveryStreak:0,
        cooldownUntil:new Date(
          current.getTime()+cooldownMs
        ).toISOString()
      };

    return {
      state:"ROLLBACK",
      failureStreak:nextFailures,
      recoveryStreak:0
    };
  }

  if(healthScore>=recoveryThreshold){
    const nextRecovery=recoveryStreak+1;
    if(nextRecovery>=requiredRecoveryStreak)
      return {
        state:"STABLE",
        failureStreak:0,
        recoveryStreak:nextRecovery
      };

    return {
      state:"RECOVERY",
      failureStreak:0,
      recoveryStreak:nextRecovery
    };
  }

  return {
    state:"RECOVERY",
    failureStreak,
    recoveryStreak
  };
}

module.exports={persistentCooldown};
