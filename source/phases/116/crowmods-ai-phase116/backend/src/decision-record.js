function validateDecision({
  decision,
  rationale,
  decisionMaker
}){
  if(!decision||
     !rationale||
     String(rationale).trim().length<10||
     !decisionMaker)
    return {
      status:"BLOCKED",
      reason:"decision_record_fields_required"
    };

  return {
    status:"VALID",
    decision,
    rationale,
    decisionMaker
  };
}

module.exports={
  validateDecision
};
