function scopeMatches({
  scope,
  resource,
  action
}){
  return scope.enabled!==false &&
    scope.resource===resource &&
    scope.action===action;
}

function hasScopedPermission({
  roleScopes=[],
  effectiveRoles=[],
  resource,
  action
}){
  return roleScopes.some(binding=>{
    return effectiveRoles.includes(binding.role) &&
      scopeMatches({
        scope:binding,
        resource,
        action
      });
  });
}

module.exports={
  scopeMatches,
  hasScopedPermission
};
