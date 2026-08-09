function evaluateDelegation({
  status,
  startsAt,
  endsAt,
  now=new Date()
}){
  const current=new Date(now);
  const start=new Date(startsAt);
  const end=new Date(endsAt);

  if(Number.isNaN(current.getTime())||
     Number.isNaN(start.getTime())||
     Number.isNaN(end.getTime()))
    return {
      status:"BLOCKED",
      reason:"invalid_delegation_dates"
    };

  if(status==="REVOKED")
    return {
      status:"REVOKED"
    };

  if(current<start)
    return {
      status:"PENDING"
    };

  if(current>=end)
    return {
      status:"EXPIRED"
    };

  return {
    status:"ACTIVE"
  };
}

module.exports={
  evaluateDelegation
};
