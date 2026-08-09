function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:280};
  if(input.enabled===false) return {state:"BLOCKED",phase:280};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:280,
    feature:'Reliability Dashboard',
    objective:'Expose service reliability and worker metrics.',
    score
  };
}
module.exports={evaluate};
