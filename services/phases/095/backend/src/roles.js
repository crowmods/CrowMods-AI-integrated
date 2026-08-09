function expandRoleHierarchy({
  role,
  roleMap
}){
  const result=new Set();
  let current=role;
  const visited=new Set();

  while(current&&!visited.has(current)){
    visited.add(current);
    result.add(current);

    const definition=roleMap[current];

    if(!definition)
      break;

    current=definition.parentRole||null;
  }

  return [...result];
}

function effectiveRoles({
  roles=[],
  roleMap={}
}){
  const result=new Set();

  for(const role of roles){
    for(const expanded of expandRoleHierarchy({
      role,
      roleMap
    })){
      result.add(expanded);
    }
  }

  return [...result];
}

module.exports={
  expandRoleHierarchy,
  effectiveRoles
};
