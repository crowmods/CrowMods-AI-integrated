function hasAnyRole(
  assignedRoles,
  requiredRoles
){
  if(!requiredRoles.length)
    return true;

  return requiredRoles.some(
    role=>assignedRoles.includes(role)
  );
}

function authorize({
  identity,
  requiredRoles=[]
}){
  if(!identity?.authenticated){
    return {
      allowed:false,
      reason:"not_authenticated"
    };
  }

  if(!hasAnyRole(
    identity.roles||[],
    requiredRoles
  )){
    return {
      allowed:false,
      reason:"role_denied"
    };
  }

  return {
    allowed:true,
    reason:null
  };
}

function authorizationMiddleware({
  requiredRoles=[],
  onDecision
}={}){
  return async(req,res,next)=>{
    const decision=authorize({
      identity:req.identity,
      requiredRoles
    });

    if(typeof onDecision==="function"){
      await onDecision({
        request:req,
        decision
      });
    }

    if(!decision.allowed)
      return res.status(
        decision.reason==="not_authenticated"
          ?401
          :403
      ).json({
        error:decision.reason
      });

    next();
  };
}

module.exports={
  hasAnyRole,
  authorize,
  authorizationMiddleware
};
