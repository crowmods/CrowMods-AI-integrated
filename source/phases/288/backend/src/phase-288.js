function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:288};
  if(input.enabled===false) return {state:"BLOCKED",phase:288};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:288,
    feature:'Exception Management',
    objective:'Track approved exceptions with scope and expiry.',
    score
  };
}
module.exports={evaluate};
