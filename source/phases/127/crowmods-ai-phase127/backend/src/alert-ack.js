function acknowledgeAlert({
  fingerprint,
  actor,
  note="",
  acknowledged=true,
  now=new Date()
}){
  if(!fingerprint)
    return {
      status:"REJECTED",
      reason:"fingerprint_required"
    };

  if(!actor)
    return {
      status:"REJECTED",
      reason:"actor_required"
    };

  return {
    status:acknowledged
      ?"ACKNOWLEDGED"
      :"UNACKNOWLEDGED",
    fingerprint,
    actor,
    note,
    acknowledgedAt:new Date(now).toISOString()
  };
}

module.exports={acknowledgeAlert};
