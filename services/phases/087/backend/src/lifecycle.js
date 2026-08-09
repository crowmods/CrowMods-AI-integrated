const severityRank={
  INFO:0,
  WARNING:1,
  HIGH:2,
  CRITICAL:3
};

function transition(current,event){
  const state=String(current||"OPEN");

  if(event==="ACKNOWLEDGED"){
    if(state==="OPEN") return "ACKNOWLEDGED";
    return state;
  }

  if(event==="RESOLVED"){
    return "RESOLVED";
  }

  if(event==="REOPENED"){
    return "OPEN";
  }

  return state;
}

function highestSeverity(severities){
  return severities.reduce(
    (highest,current)=>
      severityRank[current]>severityRank[highest]
        ?current
        :highest,
    "INFO"
  );
}

function correlateIncident(alerts){
  return {
    alertCount:alerts.length,
    highestSeverity:highestSeverity(
      alerts.map(a=>a.severity||"INFO")
    ),
    sloBreach:alerts.some(
      a=>Boolean(a.sloBreach)
    )
  };
}

function shouldReopen({
  incidentStatus,
  incomingSeverity,
  previousSeverity
}){
  if(incidentStatus!=="RESOLVED")
    return false;

  return severityRank[incomingSeverity] >=
    severityRank[previousSeverity];
}

function retryEligible({
  status,
  attempts,
  maxAttempts,
  nextAttemptAt,
  now=new Date()
}){
  if(status!=="FAILED" && status!=="PENDING")
    return false;

  if(Number(attempts)>=Number(maxAttempts))
    return false;

  if(!nextAttemptAt)
    return true;

  return Date.parse(nextAttemptAt)<=new Date(now).getTime();
}

module.exports={
  severityRank,
  transition,
  highestSeverity,
  correlateIncident,
  shouldReopen,
  retryEligible
};
