function scorePrivilegedAction({
  roleCount=0,
  actionCountLastHour=0,
  deniedCountLastHour=0,
  unusualResource=false,
  afterHours=false
}){
  let score=0;

  if(roleCount>3) score+=10;
  if(actionCountLastHour>25) score+=30;
  if(actionCountLastHour>100) score+=20;
  if(deniedCountLastHour>5) score+=20;
  if(unusualResource) score+=15;
  if(afterHours) score+=10;

  let severity="LOW";

  if(score>=70) severity="CRITICAL";
  else if(score>=50) severity="HIGH";
  else if(score>=25) severity="MEDIUM";

  return {
    score,
    severity
  };
}

function anomalyReason({
  score,
  signals=[]
}){
  return `Privileged-action anomaly score ${score}: ${signals.join("; ")}`;
}

module.exports={
  scorePrivilegedAction,
  anomalyReason
};
