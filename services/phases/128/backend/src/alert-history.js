function alertHistoryEvent({
  fingerprint,
  action,
  actor,
  note=""
}){
  const actions=[
    "ACKNOWLEDGED",
    "UNACKNOWLEDGED",
    "COMMENTED"
  ];

  if(!fingerprint ||
     !actor ||
     !actions.includes(action))
    return {
      status:"REJECTED",
      reason:"invalid_history_event"
    };

  return {
    status:"RECORDED",
    fingerprint,
    action,
    actor,
    note,
    createdAt:new Date().toISOString()
  };
}

module.exports={alertHistoryEvent};
