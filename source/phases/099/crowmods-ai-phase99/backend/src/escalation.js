function escalationLevel(severity){
  if(severity==="CRITICAL") return 3;
  if(severity==="HIGH") return 2;
  if(severity==="MEDIUM") return 1;
  return 0;
}

function buildEscalation({
  alertId,
  severity,
  reason,
  destination="security-operations"
}){
  const level=escalationLevel(severity);

  return {
    alertId,
    escalationLevel:level,
    destination,
    reason,
    required:level>0
  };
}

module.exports={
  escalationLevel,
  buildEscalation
};
