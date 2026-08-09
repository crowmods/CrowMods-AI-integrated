function scheduleRecovery({
  state="ROLLBACK",
  stage=0,
  now=new Date(),
  cooldownUntil=null,
  checkIntervalMs=60000
}){
  const current=new Date(now);

  if(state==="ROLLBACK")
    return {
      state:"COOLDOWN",
      stage:0,
      cooldownUntil:new Date(
        current.getTime()+checkIntervalMs*5
      ).toISOString(),
      nextCheckAt:new Date(
        current.getTime()+checkIntervalMs*5
      ).toISOString()
    };

  if(state==="COOLDOWN"){
    const until=new Date(cooldownUntil);
    if(!Number.isNaN(until.getTime()) &&
       until>current)
      return {
        state:"COOLDOWN",
        stage,
        cooldownUntil:until.toISOString(),
        nextCheckAt:until.toISOString()
      };

    return {
      state:"RECOVERY",
      stage:Math.max(1,stage),
      nextCheckAt:new Date(
        current.getTime()+checkIntervalMs
      ).toISOString()
    };
  }

  if(state==="RECOVERY")
    return {
      state:"RECOVERY",
      stage:Math.min(stage+1,6),
      nextCheckAt:new Date(
        current.getTime()+checkIntervalMs
      ).toISOString()
    };

  return {
    state:"STABLE",
    stage:stage||6,
    nextCheckAt:null
  };
}

module.exports={scheduleRecovery};
