function evaluateAlert({
 severity="NORMAL",
 consecutiveHits=0,
 cooldownUntil=null,
 now=new Date(),
 warningThreshold=2,
 criticalThreshold=4,
 cooldownMs=300000
}){
 const current=new Date(now);
 const hits=Math.max(0,Number(consecutiveHits));
 const active=cooldownUntil &&
  new Date(cooldownUntil)>current;

 if(severity==="CRITICAL" && hits>=criticalThreshold)
   return {action:"ESCALATE",severity:"CRITICAL",cooldownActive:!!active};

 if(severity==="WARNING" && hits>=criticalThreshold)
   return {
    action:"ESCALATE",
    severity:"CRITICAL",
    cooldownActive:!!active
   };

 if(severity==="WARNING" && hits>=warningThreshold)
   return {
    action:"TRIGGER",
    severity:"WARNING",
    cooldownActive:!!active
   };

 if(severity==="NORMAL")
   return {action:"RESET",severity:"NORMAL",cooldownActive:false};

 return {
  action:active?"SUPPRESS":"TRIGGER",
  severity,
  cooldownActive:!!active,
  cooldownUntil:active
   ?new Date(cooldownUntil).toISOString()
   :new Date(current.getTime()+cooldownMs).toISOString()
 };
}
module.exports={evaluateAlert};
