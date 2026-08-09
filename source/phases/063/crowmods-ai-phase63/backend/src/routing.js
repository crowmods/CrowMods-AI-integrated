function normalizeSeverity(severity){
  const allowed=["LOW","MEDIUM","HIGH","CRITICAL"];
  return allowed.includes(severity)?severity:"MEDIUM";
}

function escalationDecision({
  status="OPEN",
  acknowledged=false,
  escalationLevel=0,
  maxEscalations=3
}){
  if(status==="RESOLVED")return {action:"NONE"};
  if(acknowledged)return {action:"WAIT_FOR_RESOLUTION"};
  if(escalationLevel>=maxEscalations)
    return {action:"PAGE_INCIDENT_COMMANDER"};

  return {
    action:escalationLevel===0?"NOTIFY_PRIMARY":"ESCALATE",
    nextLevel:escalationLevel+1
  };
}

function dedupeKey({service,severity,alertName}){
  return `${service}:${normalizeSeverity(severity)}:${alertName}`;
}

module.exports={normalizeSeverity,escalationDecision,dedupeKey};
