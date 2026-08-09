function scoreSession({
  eventCount=0,
  deniedCount=0,
  sensitiveActionCount=0,
  unusualResource=false,
  sourceChanged=false
}){
  let score=0;

  if(eventCount>50) score+=20;
  if(eventCount>150) score+=20;
  if(deniedCount>3) score+=20;
  if(sensitiveActionCount>10) score+=25;
  if(unusualResource) score+=15;
  if(sourceChanged) score+=15;

  let severity="LOW";
  if(score>=70) severity="CRITICAL";
  else if(score>=50) severity="HIGH";
  else if(score>=25) severity="MEDIUM";

  return {score,severity};
}

function suspiciousSession(score){
  return score>=50;
}

module.exports={
  scoreSession,
  suspiciousSession
};
