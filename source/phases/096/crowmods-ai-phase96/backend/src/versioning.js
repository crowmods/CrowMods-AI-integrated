function nextVersion(versions=[]){
  if(!versions.length) return 1;

  return Math.max(
    ...versions.map(
      item=>Number(item.versionNumber||item.version_number||0)
    )
  )+1;
}

function versionState(policy){
  return {
    resource:policy.resource,
    action:policy.action,
    requiredRoles:policy.requiredRoles||policy.required_roles||[],
    effect:policy.effect,
    enabled:policy.enabled,
    priority:policy.priority
  };
}

function rollbackTarget(versions,versionNumber){
  return versions.find(
    version=>
      Number(
        version.versionNumber||
        version.version_number
      )===Number(versionNumber)
  )||null;
}

module.exports={
  nextVersion,
  versionState,
  rollbackTarget
};
