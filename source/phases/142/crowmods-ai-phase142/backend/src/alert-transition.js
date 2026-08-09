function evaluateRecovery({
 state="NORMAL",
 healthyCycles=0,
 cooldownUntil=null,
 now=new Date(),
 recoveryCycles=3,
 cooldownMs=300000
}){
 const current=new Date(now);
 const healthy=Math.max(0,Number(healthyCycles));
 const active=cooldownUntil &&
   new Date(cooldownUntil)>current;

 if(active)
   return {
    action:"HOLD",
    state,
    reason:"cooldown_active",
    cooldownUntil:new Date(cooldownUntil).toISOString()
   };

 if(state==="CRITICAL" && healthy>=recoveryCycles)
   return {
    action:"RECOVER",
    state:"WARNING",
    reason:"healthy_recovery",
    cooldownUntil:new Date(
      current.getTime()+cooldownMs
    ).toISOString()
   };

 if(state==="WARNING" && healthy>=recoveryCycles)
   return {
    action:"RESET",
    state:"NORMAL",
    reason:"healthy_recovery",
    cooldownUntil:new Date(
      current.getTime()+cooldownMs
    ).toISOString()
   };

 return {
  action:"HOLD",
  state,
  reason:"recovery_threshold_not_met",
  cooldownUntil:null
 };
}
module.exports={evaluateRecovery};
