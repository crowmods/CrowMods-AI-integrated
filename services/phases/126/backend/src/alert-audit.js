function buildAuditEvent({
  fingerprint,
  action,
  actor="system",
  details={}
}){
  if(!fingerprint)
    throw new Error("fingerprint_required");

  const allowed=[
    "CREATED",
    "ACKNOWLEDGED",
    "SUPPRESSED",
    "UNSUPPRESSED",
    "ESCALATED",
    "ROUTED"
  ];

  if(!allowed.includes(action))
    throw new Error("invalid_alert_action");

  return {
    fingerprint,
    action,
    actor,
    details,
    occurredAt:new Date().toISOString()
  };
}

module.exports={buildAuditEvent};
