function determineRevocation({
  status,
  endsAt,
  now=new Date()
}){
  if(status==="REVOKED")
    return {
      action:"SKIPPED",
      reason:"already_revoked"
    };

  const expiry=new Date(endsAt);
  const current=new Date(now);

  if(Number.isNaN(expiry.getTime())||
     Number.isNaN(current.getTime()))
    return {
      action:"SKIPPED",
      reason:"invalid_expiry"
    };

  if(expiry<=current)
    return {
      action:"EXECUTE",
      reason:"delegation_expired"
    };

  return {
    action:"SCHEDULED",
    reason:"delegation_still_active"
  };
}

module.exports={
  determineRevocation
};
