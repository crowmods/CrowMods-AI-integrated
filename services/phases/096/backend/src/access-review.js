function reviewDecision({
  decision,
  reason
}){
  const allowed=[
    "RETAIN",
    "REVOKE",
    "FLAG"
  ];

  if(!allowed.includes(decision))
    return {
      valid:false,
      reason:"invalid_decision"
    };

  if(!reason||
     String(reason).trim().length<3)
    return {
      valid:false,
      reason:"review_reason_required"
    };

  return {
    valid:true
  };
}

function campaignStatus(decisions,totalSubjects){
  if(totalSubjects<=0)
    return "CLOSED";

  if(decisions>=totalSubjects)
    return "READY_TO_CLOSE";

  return "OPEN";
}

module.exports={
  reviewDecision,
  campaignStatus
};
