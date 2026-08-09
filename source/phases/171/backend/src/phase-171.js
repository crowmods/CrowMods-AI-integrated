function evaluate(input={}){
  const actor=String(input.actorId||"");
  const action=String(input.action||"");
  const resource=String(input.resource||"");
  if(!actor) return {state:"DENY",reason:"actor_required",phase:171};
  if(!action) return {state:"DENY",reason:"action_required",phase:171};
  if(!resource) return {state:"DENY",reason:"resource_required",phase:171};

  const allowed=Array.isArray(input.allowed)
    ?input.allowed.some(x=>
      String(x.actorId)===actor &&
      String(x.action)===action &&
      String(x.resource)===resource &&
      x.enabled!==false)
    :false;

  return {
    state:allowed?"ALLOW":"DENY",
    phase:171,
    feature:'RBAC Engine'
  };
}
module.exports={evaluate};
