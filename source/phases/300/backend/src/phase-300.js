function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:300};
  if(input.enabled===false) return {state:"BLOCKED",phase:300};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:300,
    feature:'Final CrowMods AI Platform Release',
    objective:'Provide the final release manifest and platform readiness summary.',
    score
  };
}
module.exports={evaluate};
