function evaluate(input={}){
  const actor=String(input.actorId||"");
  if(!actor) return {state:"REJECTED",reason:"actor_required",phase:200};

  const value=input.value;
  if(value!==undefined && value!==null && typeof value==="object")
    return {state:"REJECTED",reason:"unsafe_object_input",phase:200};

  return {
    state:"READY",
    phase:200,
    feature:'Threat Detection Dashboard',
    objective:'Expose consolidated detection and threat metrics.'
  };
}
module.exports={evaluate};
