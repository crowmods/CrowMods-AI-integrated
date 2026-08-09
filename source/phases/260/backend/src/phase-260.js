function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:260};
  if(input.enabled===false) return {state:"BLOCKED",phase:260};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:260,
    feature:'Threat Intelligence Dashboard',
    objective:'Expose intelligence quality and lifecycle metrics.',
    score
  };
}
module.exports={evaluate};
