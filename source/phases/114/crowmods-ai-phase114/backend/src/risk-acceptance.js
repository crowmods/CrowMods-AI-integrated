function requestAcceptance({
  riskStatement,
  owner,
  expiresAt
}){
  if(!riskStatement||!owner)
    return {
      status:"BLOCKED",
      reason:"risk_statement_and_owner_required"
    };

  if(expiresAt){
    const expiry=new Date(expiresAt);
    if(Number.isNaN(expiry.getTime())||
       expiry<=new Date())
      return {
        status:"BLOCKED",
        reason:"invalid_or_expired_acceptance"
      };
  }

  return {
    status:"REQUESTED",
    riskStatement,
    owner,
    expiresAt:expiresAt||null
  };
}

function evaluateAcceptance({
  status,
  expiresAt,
  now=new Date()
}){
  if(status!=="APPROVED")
    return {
      status,
      active:false
    };

  if(!expiresAt)
    return {
      status:"APPROVED",
      active:true
    };

  const expiry=new Date(expiresAt);
  const current=new Date(now);

  if(Number.isNaN(expiry.getTime())||
     expiry<=current)
    return {
      status:"EXPIRED",
      active:false
    };

  return {
    status:"APPROVED",
    active:true
  };
}

module.exports={
  requestAcceptance,
  evaluateAcceptance
};
