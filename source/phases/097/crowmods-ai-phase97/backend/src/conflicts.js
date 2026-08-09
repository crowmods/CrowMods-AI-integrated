function sameTarget(a,b){
  return a.resource===b.resource &&
    a.action===b.action;
}

function sameRoleSet(a,b){
  const x=new Set(a.requiredRoles||[]);
  const y=new Set(b.requiredRoles||[]);

  if(x.size!==y.size)
    return false;

  for(const role of x){
    if(!y.has(role))
      return false;
  }

  return true;
}

function analyzePolicyConflicts(policies=[]){
  const conflicts=[];

  for(let i=0;i<policies.length;i++){
    for(let j=i+1;j<policies.length;j++){
      const a=policies[i];
      const b=policies[j];

      if(!a.enabled||!b.enabled)
        continue;

      if(!sameTarget(a,b))
        continue;

      if(a.effect===b.effect)
        continue;

      if(sameRoleSet(a,b)){
        conflicts.push({
          policyA:a.id,
          policyB:b.id,
          resource:a.resource,
          action:a.action,
          conflictType:"OPPOSING_EFFECTS_SAME_ROLES",
          severity:"HIGH"
        });
      }
    }
  }

  return conflicts;
}

module.exports={
  analyzePolicyConflicts
};
