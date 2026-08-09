const MODES=new Set([
  "WORKLOAD_IDENTITY",
  "MTLS",
  "SIGNED_TOKEN",
  "BLOCKED"
]);

function validateSourcePolicy({
  sourceName,
  authMode,
  expectedAudience,
  presentedAudience,
  authenticated
}){
  if(!sourceName||!MODES.has(authMode))
    return {
      status:"BLOCKED",
      reason:"invalid_source_policy"
    };

  if(authMode==="BLOCKED")
    return {
      status:"REJECTED",
      reason:"source_disabled"
    };

  if(!authenticated)
    return {
      status:"REJECTED",
      reason:"authentication_required"
    };

  if(expectedAudience &&
     expectedAudience!==presentedAudience)
    return {
      status:"REJECTED",
      reason:"audience_mismatch"
    };

  return {
    status:"ACCEPTED",
    sourceName,
    authMode
  };
}

module.exports={
  MODES,
  validateSourcePolicy
};
