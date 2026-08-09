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
    phase:160,
    feature:'Approval/Replay Reliability Dashboard',
    objective:'Expose consolidated reliability metrics for approval and replay controls.'
  };
}
module.exports={evaluate};
