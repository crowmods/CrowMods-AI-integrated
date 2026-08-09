function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:232};
  const action=String(input.action||"evaluate");
  if(input.enabled===false) return {state:"BLOCKED",phase:232};
  return {
    state:"READY",
    phase:232,
    feature:'Incident Classification',
    action,
    objective:'Classify incidents using controlled categories.'
  };
}
module.exports={evaluate};
