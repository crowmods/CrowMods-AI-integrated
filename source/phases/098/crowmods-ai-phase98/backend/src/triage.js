const decisions=new Set([
  "ACKNOWLEDGED",
  "FALSE_POSITIVE",
  "ESCALATED",
  "CLOSED"
]);

function validateTriage({
  decision,
  notes
}){
  if(!decisions.has(decision))
    return {
      valid:false,
      reason:"invalid_triage_decision"
    };

  if(!notes||String(notes).trim().length<3)
    return {
      valid:false,
      reason:"triage_notes_required"
    };

  return {
    valid:true
  };
}

function nextAlertStatus(decision){
  if(decision==="ACKNOWLEDGED")
    return "ACKNOWLEDGED";
  if(decision==="CLOSED"||decision==="FALSE_POSITIVE")
    return "CLOSED";
  if(decision==="ESCALATED")
    return "OPEN";
  return "OPEN";
}

module.exports={
  validateTriage,
  nextAlertStatus
};
