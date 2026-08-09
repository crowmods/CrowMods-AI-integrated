const crypto=require("crypto");

function fingerprint({
  alertType,
  message,
  resourceKey=""
}){
  return crypto
    .createHash("sha256")
    .update(
      `${alertType}|${resourceKey}|${message}`
    )
    .digest("hex");
}

function classifyEscalation({
  severity,
  occurrences,
  escalationCount=3
}){
  if(severity==="CRITICAL")
    return {
      escalated:true,
      reason:"critical_alert"
    };

  if(Number(occurrences)>=escalationCount)
    return {
      escalated:true,
      reason:"repeated_alert"
    };

  return {
    escalated:false,
    reason:"below_escalation_threshold"
  };
}

function buildAlert(input){
  const fp=fingerprint(input);
  const escalation=classifyEscalation(input);

  return {
    ...input,
    fingerprint:fp,
    ...escalation
  };
}

module.exports={
  fingerprint,
  classifyEscalation,
  buildAlert
};
