function buildEvidence({
  incidentId,
  evidenceType,
  source,
  summary,
  payload={}
}){
  return {
    incidentId,
    evidenceType,
    source,
    summary,
    payload,
    collectedAt:new Date().toISOString()
  };
}

function packageStatus(evidenceCount,minimumEvidence=3){
  return Number(evidenceCount)>=Number(minimumEvidence)
    ?"READY"
    :"DRAFT";
}

function approvalDecision({
  closureEligible,
  packageReady,
  requestedBy,
  approvedBy=null
}){
  if(!requestedBy)
    return {
      allowed:false,
      reason:"Requester is required"
    };

  if(!closureEligible)
    return {
      allowed:false,
      reason:"Closure gates are not satisfied"
    };

  if(!packageReady)
    return {
      allowed:false,
      reason:"Evidence package is not ready"
    };

  if(!approvedBy)
    return {
      allowed:false,
      reason:"Explicit approver is required"
    };

  return {
    allowed:true,
    reason:"Closure approval requirements satisfied"
  };
}

module.exports={
  buildEvidence,
  packageStatus,
  approvalDecision
};
