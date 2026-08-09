function escalationLevel({
  status,
  severity,
  hoursOverdue=0
}){
  if(status!=="OVERDUE")
    return 0;

  if(severity==="CRITICAL"||
     hoursOverdue>=72)
    return 3;

  if(severity==="HIGH"||
     hoursOverdue>=24)
    return 2;

  return 1;
}

function escalationTarget(level){
  if(level>=3) return "SECURITY_EXECUTIVE";
  if(level===2) return "SECURITY_MANAGER";
  if(level===1) return "ACTION_OWNER";
  return "NONE";
}

function createEscalation(input){
  const level=escalationLevel(input);

  return {
    level,
    target:escalationTarget(level),
    status:level>0?"OPEN":"NO_ACTION",
    reason:
      level>0
        ?"Corrective action SLA escalation"
        :"Action is not overdue"
  };
}

module.exports={
  escalationLevel,
  escalationTarget,
  createEscalation
};
