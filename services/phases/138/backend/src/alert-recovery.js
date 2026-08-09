function evaluateRecovery({
 severity="NORMAL",
 consecutiveHits=0,
 consecutiveHealthy=0,
 warningHits=2,
 criticalHits=4,
 recoveryCycles=3
}){
 const hits=Math.max(0,Number(consecutiveHits));
 const healthy=Math.max(0,Number(consecutiveHealthy));

 if(severity==="CRITICAL" && healthy>=recoveryCycles)
   return {action:"RECOVER",severity:"WARNING",healthyCycles:healthy};

 if(severity==="WARNING" && healthy>=recoveryCycles)
   return {action:"RESET",severity:"NORMAL",healthyCycles:healthy};

 if(severity==="WARNING" && hits>=criticalHits)
   return {action:"ESCALATE",severity:"CRITICAL",healthyCycles:healthy};

 if(severity==="NORMAL" && hits>=warningHits)
   return {action:"ESCALATE",severity:"WARNING",healthyCycles:healthy};

 return {
  action:"HOLD",
  severity,
  healthyCycles:healthy
 };
}

module.exports={evaluateRecovery};
