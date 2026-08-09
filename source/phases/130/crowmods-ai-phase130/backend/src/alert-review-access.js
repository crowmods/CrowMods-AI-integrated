const ROLE_PERMISSIONS={
  viewer:new Set(["VIEW"]),
  operator:new Set(["VIEW","ACKNOWLEDGE"]),
  security_admin:new Set(["VIEW","ACKNOWLEDGE","EXPORT"])
};

function authorizeReview({
  role,
  action="VIEW"
}){
  const permissions=ROLE_PERMISSIONS[role];
  if(!permissions)
    return {allowed:false,reason:"unknown_role"};

  if(!permissions.has(action))
    return {allowed:false,reason:"permission_denied"};

  return {allowed:true};
}

function paginate({
  page=1,
  pageSize=50
}){
  const safePage=Math.max(1,Number(page)||1);
  const safeSize=Math.min(
    100,
    Math.max(1,Number(pageSize)||50)
  );

  return {
    page:safePage,
    pageSize:safeSize,
    offset:(safePage-1)*safeSize
  };
}

module.exports={ROLE_PERMISSIONS,authorizeReview,paginate};
