const allowedActions=new Set([
  "ROTATE_CERTIFICATE",
  "REFRESH_JWKS_CACHE",
  "RESTORE_SIEM_CONNECTIVITY",
  "RESTORE_KMS_CONNECTIVITY",
  "RECHECK_DATABASE_TLS"
]);

function validatePlan({
  controlKey,
  action,
  reason,
  requestedBy
}){
  if(!controlKey||!requestedBy)
    return {
      valid:false,
      reason:"control_and_requester_required"
    };

  if(!allowedActions.has(action))
    return {
      valid:false,
      reason:"action_not_allowed"
    };

  if(!reason||String(reason).trim().length<5)
    return {
      valid:false,
      reason:"reason_required"
    };

  return {
    valid:true
  };
}

function requiresApproval(riskLevel){
  return ["HIGH","CRITICAL"].includes(
    riskLevel
  );
}

function canExecute({
  status,
  requestedBy,
  approvedBy,
  riskLevel
}){
  if(status!=="APPROVED")
    return false;

  if(requiresApproval(riskLevel))
    return Boolean(
      approvedBy &&
      approvedBy!==requestedBy
    );

  return true;
}

module.exports={
  allowedActions,
  validatePlan,
  requiresApproval,
  canExecute
};
