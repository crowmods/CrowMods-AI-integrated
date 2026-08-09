function normalizeRoles(roles=[]){
  return [...new Set(
    roles.filter(
      role=>typeof role==="string"&&role.length>0
    )
  )];
}

function matchesPolicy(policy,resource,action){
  return policy.enabled!==false &&
    policy.resource===resource &&
    policy.action===action;
}

function roleMatch(userRoles,requiredRoles){
  if(!requiredRoles.length)
    return true;

  const assigned=new Set(
    normalizeRoles(userRoles)
  );

  return requiredRoles.some(
    role=>assigned.has(role)
  );
}

function evaluatePolicies({
  identity,
  resource,
  action,
  policies=[]
}){
  if(!identity?.authenticated){
    return {
      allowed:false,
      reason:"not_authenticated",
      policy:null
    };
  }

  const candidates=policies
    .filter(policy=>
      matchesPolicy(policy,resource,action)
    )
    .sort(
      (a,b)=>
        Number(a.priority??100)-
        Number(b.priority??100)
    );

  for(const policy of candidates){
    const roles=Array.isArray(policy.requiredRoles)
      ?policy.requiredRoles
      :[];

    if(!roleMatch(identity.roles,roles))
      continue;

    if(policy.effect==="DENY"){
      return {
        allowed:false,
        reason:"explicit_deny",
        policy
      };
    }

    return {
      allowed:true,
      reason:"policy_allow",
      policy
    };
  }

  return {
    allowed:false,
    reason:"default_deny",
    policy:null
  };
}

module.exports={
  normalizeRoles,
  matchesPolicy,
  roleMatch,
  evaluatePolicies
};
