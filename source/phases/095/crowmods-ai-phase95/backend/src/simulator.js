const {
  evaluatePolicies
}=require("./policy");
const {
  effectiveRoles
}=require("./roles");

function simulateAuthorization({
  identity,
  resource,
  action,
  policies=[],
  roleMap={}
}){
  const roles=effectiveRoles({
    roles:identity?.roles||[],
    roleMap
  });

  const simulationIdentity={
    ...identity,
    roles
  };

  const decision=evaluatePolicies({
    identity:simulationIdentity,
    resource,
    action,
    policies
  });

  return {
    ...decision,
    simulated:true,
    effectiveRoles:roles
  };
}

module.exports={
  simulateAuthorization
};
