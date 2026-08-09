function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:255};
  if(input.enabled===false) return {state:"BLOCKED",phase:255};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:255,
    feature:'Threat Actor Profiles',
    objective:'Maintain sanitized threat-actor metadata and confidence.',
    score
  };
}
module.exports={evaluate};
