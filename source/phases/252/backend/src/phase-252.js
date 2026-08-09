function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:252};
  if(input.enabled===false) return {state:"BLOCKED",phase:252};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:252,
    feature:'IOC Normalization',
    objective:'Normalize supported indicators into canonical forms.',
    score
  };
}
module.exports={evaluate};
