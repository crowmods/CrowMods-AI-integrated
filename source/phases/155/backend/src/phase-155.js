function evaluate(input={}) {
  const enabled=input.enabled!==false;
  const actor=String(input.actorId||"");
  const reason=String(input.reason||"");
  if(!enabled) return {state:"BLOCKED",reason:"disabled"};
  if(!actor && input.requiresActor!==false)
    return {state:"REJECTED",reason:"actor_required"};
  if(!reason && input.requiresReason!==false)
    return {state:"REJECTED",reason:"reason_required"};
  return {
    state:"READY",
    phase:155,
    feature:'Approval Conflict Resolution',
    objective:'Detect conflicting approval decisions and resolve them with deterministic, auditable precedence.'
  };
}
module.exports={evaluate};
