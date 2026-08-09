function evaluateActionSla({
  dueAt,
  now=new Date(),
  warningHours=24
}){
  if(!dueAt)
    return {
      status:"BLOCKED",
      severity:"HIGH",
      reason:"due_date_missing"
    };

  const due=new Date(dueAt);
  const current=new Date(now);

  if(Number.isNaN(due.getTime())||
     Number.isNaN(current.getTime()))
    return {
      status:"BLOCKED",
      severity:"HIGH",
      reason:"invalid_date"
    };

  const hours=(due-current)/3600000;

  if(hours<0)
    return {
      status:"OVERDUE",
      severity:hours<=-24
        ?"CRITICAL"
        :"HIGH",
      hoursRemaining:Number(
        hours.toFixed(2)
      )
    };

  if(hours<=warningHours)
    return {
      status:"DUE_SOON",
      severity:"MEDIUM",
      hoursRemaining:Number(
        hours.toFixed(2)
      )
    };

  return {
    status:"ON_TRACK",
    severity:"INFO",
    hoursRemaining:Number(
      hours.toFixed(2)
    )
  };
}

module.exports={
  evaluateActionSla
};
