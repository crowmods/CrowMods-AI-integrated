function routeForSeverity(severity){
  if(severity==="CRITICAL")
    return "SECURITY";
  if(severity==="WARNING")
    return "OPS";
  return "GOVERNANCE";
}

function routeAlert({
  severity="INFO",
  acknowledged=false,
  suppressedUntil=null,
  now=new Date(),
  escalationLevel=0
}){
  const current=new Date(now);

  if(acknowledged)
    return {
      route:"NONE",
      escalationLevel,
      state:"ACKNOWLEDGED"
    };

  if(suppressedUntil){
    const until=new Date(suppressedUntil);
    if(until>current)
      return {
        route:"NONE",
        escalationLevel,
        state:"SUPPRESSED",
        suppressedUntil:until.toISOString()
      };
  }

  return {
    route:routeForSeverity(severity),
    escalationLevel:
      severity==="CRITICAL"
        ?Math.max(2,escalationLevel)
        :escalationLevel,
    state:"ROUTED"
  };
}

module.exports={routeForSeverity,routeAlert};
