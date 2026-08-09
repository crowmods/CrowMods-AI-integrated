const DECISIONS=new Set([
  "PENDING",
  "APPROVED",
  "REJECTED"
]);

function createApprovalChain({
  requiredLevel,
  approvers=[]
}){
  if(requiredLevel<1||
     approvers.length<requiredLevel)
    return {
      status:"BLOCKED",
      reason:"invalid_approval_chain"
    };

  return {
    status:"PENDING",
    currentLevel:1,
    requiredLevel,
    steps:approvers
      .slice(0,requiredLevel)
      .map((approver,index)=>({
        level:index+1,
        approver,
        decision:"PENDING"
      }))
  };
}

function applyDecision({
  chain,
  level,
  decision
}){
  if(!chain||
     !DECISIONS.has(decision)||
     level!==chain.currentLevel)
    return {
      status:"BLOCKED",
      reason:"invalid_approval_step"
    };

  const steps=chain.steps.map(step=>
    step.level===level
      ?{...step,decision}
      :step
  );

  if(decision==="REJECTED")
    return {
      ...chain,
      steps,
      status:"REJECTED"
    };

  if(level===chain.requiredLevel)
    return {
      ...chain,
      steps,
      status:"APPROVED"
    };

  return {
    ...chain,
    steps,
    currentLevel:level+1,
    status:"PENDING"
  };
}

module.exports={
  createApprovalChain,
  applyDecision
};
