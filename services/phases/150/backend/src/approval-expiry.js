function evaluateApproval({
 decision="APPROVE",
 expiresAt,
 now=new Date()
}){
 const expiry=new Date(expiresAt);

 if(decision!=="APPROVE")
  return {state:"INVALID"};

 if(!Number.isFinite(expiry.getTime()))
  return {state:"INVALID"};

 return expiry<=new Date(now)
  ?{state:"EXPIRED"}
  :{state:"ACTIVE"};
}

function revokeApproval({
 approvalId,
 actorId,
 reason
}){
 if(!approvalId||!actorId||!reason)
  return {status:"REJECTED"};

 return {
  status:"REVOKED",
  approvalId,
  actorId,
  reason
 };
}

module.exports={evaluateApproval,revokeApproval};
