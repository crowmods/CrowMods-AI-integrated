const REVIEW_STATES=new Set([
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "CLOSED"
]);

const ACTION_STATES=new Set([
  "OPEN",
  "IN_PROGRESS",
  "DONE",
  "ACCEPTED_RISK"
]);

function validateReview({
  summary,
  rootCause=""
}){
  if(!summary||
     String(summary).trim().length<10)
    return {
      valid:false,
      reason:"summary_required"
    };

  if(rootCause&&
     String(rootCause).trim().length<5)
    return {
      valid:false,
      reason:"invalid_root_cause"
    };

  return {
    valid:true
  };
}

function canCloseReview({
  status,
  unresolvedCriticalActions=0
}){
  return status==="APPROVED" &&
    unresolvedCriticalActions===0;
}

module.exports={
  REVIEW_STATES,
  ACTION_STATES,
  validateReview,
  canCloseReview
};
