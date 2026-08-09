function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:225};
  const action=String(input.action||"evaluate");
  if(input.enabled===false) return {state:"BLOCKED",phase:225};
  return {
    state:"READY",
    phase:225,
    feature:'Exploitability Prioritization',
    action,
    objective:'Prioritize vulnerabilities using bounded exploitability signals.'
  };
}
module.exports={evaluate};
