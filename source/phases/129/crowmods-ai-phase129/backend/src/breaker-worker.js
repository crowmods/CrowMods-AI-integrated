function breakerWorkerDecision({
  state="OPEN",
  cooldownUntil,
  now=new Date(),
  halfOpenAfterMs=30000
}){
  const current=new Date(now);
  const until=new Date(cooldownUntil);

  if(state==="OPEN"){
    if(Number.isNaN(until.getTime()))
      return {
        action:"HOLD",
        reason:"invalid_cooldown"
      };

    if(until>current)
      return {
        action:"WAIT",
        nextCheckAt:until.toISOString()
      };

    return {
      action:"PROBE",
      nextState:"HALF_OPEN"
    };
  }

  if(state==="HALF_OPEN")
    return {
      action:"EVALUATE_PROBE"
    };

  return {
    action:"IDLE"
  };
}

module.exports={breakerWorkerDecision};
