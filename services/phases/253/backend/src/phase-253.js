function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:253};
  if(input.enabled===false) return {state:"BLOCKED",phase:253};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:253,
    feature:'IOC Reputation Scoring',
    objective:'Calculate bounded reputation scores from validated signals.',
    score
  };
}
module.exports={evaluate};
