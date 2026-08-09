const STATES=[
  "DETECTED",
  "VALIDATING",
  "APPROVAL_REQUIRED",
  "RECOVERING",
  "VERIFYING",
  "RESTORED",
  "FAILED"
];

function startRecovery({
  securityCritical=true
}){
  return securityCritical
    ?{
      state:"DETECTED",
      next:"VALIDATING"
    }
    :{
      state:"DETECTED",
      next:"APPROVAL_REQUIRED"
    };
}

function validationResult({
  healthy,
  approved=false,
  securityCritical=true
}){
  if(!healthy)
    return {
      state:"FAILED",
      reason:"provider_still_unhealthy"
    };

  if(securityCritical&&!approved)
    return {
      state:"APPROVAL_REQUIRED",
      reason:"independent_approval_required"
    };

  return {
    state:"RECOVERING",
    reason:"recovery_authorized"
  };
}

function verificationResult({
  healthy,
  securityChecksPassed
}){
  if(healthy&&securityChecksPassed)
    return {
      state:"RESTORED",
      allowSensitiveOperations:true
    };

  return {
    state:"FAILED",
    allowSensitiveOperations:false
  };
}

module.exports={
  STATES,
  startRecovery,
  validationResult,
  verificationResult
};
