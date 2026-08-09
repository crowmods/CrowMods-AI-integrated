function evaluateApproval({
 policyEnabled=true,
 approvals=0,
 requiredApprovals=1,
 priorRedrives=0,
 maxRedrives=1,
 actorId,
 reason=""
}){
 if(!policyEnabled)
  return {status:"REJECTED",reason:"policy_disabled"};

 if(!actorId||!reason)
  return {status:"REJECTED",reason:"missing_approval_context"};

 if(Number(priorRedrives)>=Number(maxRedrives))
  return {status:"REJECTED",reason:"redrive_limit_reached"};

 if(Number(approvals)<Number(requiredApprovals))
  return {status:"PENDING",reason:"approval_threshold_not_met"};

 return {
  status:"APPROVED",
  actorId,
  reason
 };
}
module.exports={evaluateApproval};
