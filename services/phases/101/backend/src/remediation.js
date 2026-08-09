const VALID_STATUS=new Set([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "ACCEPTED_RISK"
]);

function validateRemediation({
  title,
  severity,
  owner
}){
  if(!title)
    return {
      valid:false,
      reason:"title_required"
    };

  if(!["LOW","MEDIUM","HIGH","CRITICAL"].includes(
    severity
  ))
    return {
      valid:false,
      reason:"invalid_severity"
    };

  if(!owner)
    return {
      valid:false,
      reason:"owner_required"
    };

  return {
    valid:true
  };
}

function canClose(status){
  return VALID_STATUS.has(status) &&
    ["RESOLVED","ACCEPTED_RISK"].includes(status);
}

module.exports={
  VALID_STATUS,
  validateRemediation,
  canClose
};
