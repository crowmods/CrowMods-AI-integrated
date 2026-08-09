function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:251};
  if(input.enabled===false) return {state:"BLOCKED",phase:251};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:251,
    feature:'Threat Intelligence Ingestion',
    objective:'Accept controlled threat-intelligence records with source and timestamp metadata.',
    score
  };
}
module.exports={evaluate};
