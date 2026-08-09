function updateHysteresis({
 currentSeverity="NORMAL",
 candidateSeverity="NORMAL",
 breachCycles=0,
 recoveryCycles=0,
 breachThreshold=2,
 recoveryThreshold=3
}){
 const breach = Math.max(0,Number(breachCycles));
 const recovery = Math.max(0,Number(recoveryCycles));

 if(candidateSeverity!=="NORMAL"){
  const next=breach+1;
  if(next>=Number(breachThreshold))
   return {
    severity:candidateSeverity,
    breachCycles:next,
    recoveryCycles:0
   };
  return {
   severity:currentSeverity,
   breachCycles:next,
   recoveryCycles:0
  };
 }

 const nextRecovery=recovery+1;
 if(currentSeverity!=="NORMAL" &&
    nextRecovery>=Number(recoveryThreshold))
  return {
   severity:"NORMAL",
   breachCycles:0,
   recoveryCycles:nextRecovery
  };

 return {
  severity:currentSeverity,
  breachCycles:0,
  recoveryCycles:nextRecovery
 };
}
module.exports={updateHysteresis};
