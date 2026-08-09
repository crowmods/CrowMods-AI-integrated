function validateDelegation({
  delegator,
  delegate,
  approvalLevel,
  startsAt,
  endsAt
}){
  if(!delegator||!delegate||
     delegator===delegate||
     approvalLevel<1)
    return {
      status:"BLOCKED",
      reason:"invalid_delegation"
    };

  const start=new Date(startsAt);
  const end=new Date(endsAt);

  if(Number.isNaN(start.getTime())||
     Number.isNaN(end.getTime())||
     end<=start)
    return {
      status:"BLOCKED",
      reason:"invalid_delegation_window"
    };

  return {
    status:"VALID",
    delegator,
    delegate,
    approvalLevel,
    startsAt:start.toISOString(),
    endsAt:end.toISOString()
  };
}

function canDelegateApproval({
  delegator,
  delegate,
  originalApprover,
  decisionMaker
}){
  if(!delegator||!delegate)
    return false;

  if(delegate===originalApprover)
    return false;

  if(decisionMaker===delegator)
    return false;

  if(decisionMaker===originalApprover)
    return true;

  return decisionMaker===delegate;
}

module.exports={
  validateDelegation,
  canDelegateApproval
};
