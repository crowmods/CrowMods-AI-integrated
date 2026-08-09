function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:259};
  if(input.enabled===false) return {state:"BLOCKED",phase:259};
  const score=Number.isFinite(Number(input.score))
    ?Math.min(100,Math.max(0,Number(input.score))):null;
  return {
    state:"READY",
    phase:259,
    feature:'Intelligence-to-Detection Linking',
    objective:'Link validated intelligence to detection rules.',
    score
  };
}
module.exports={evaluate};
