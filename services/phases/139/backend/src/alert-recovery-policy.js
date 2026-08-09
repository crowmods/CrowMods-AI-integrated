function evaluatePolicy({
 severity="NORMAL",
 consecutiveHealthy=0,
 recoveryCooldownUntil=null,
 escalationCount=0,
 escalationCap=3,
 now=new Date(),
 recoveryCycles=3,
 cooldownMs=300000
}){
 const current=new Date(now);
 const healthy=Math.max(0,Number(consecutiveHealthy));
 const count=Math.max(0,Number(escalationCount));
 const cap=Math.max(1,Number(escalationCap));

 const cooldownActive=
  recoveryCooldownUntil &&
  new Date(recoveryCooldownUntil)>current;

 if(cooldownActive)
   return {action:"HOLD",severity,cooldownActive:true};

 if((severity==="CRITICAL"||severity==="WARNING") &&
    healthy>=recoveryCycles){
   return {
    action:"RECOVER",
    severity:severity==="CRITICAL"?"WARNING":"NORMAL",
    cooldownActive:false,
    recoveryCooldownUntil:
      new Date(current.getTime()+cooldownMs).toISOString()
   };
 }

 if(severity==="WARNING" && count>=cap)
   return {
    action:"CAP",
    severity:"WARNING",
    cooldownActive:false,
    escalationCount:count
   };

 return {
  action:"HOLD",
  severity,
  cooldownActive:false,
  escalationCount:count
 };
}
module.exports={evaluatePolicy};
