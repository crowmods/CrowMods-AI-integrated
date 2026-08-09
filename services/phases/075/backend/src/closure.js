function sloHealthy({observedValue,targetValue,direction="LOWER"}){
  const observed=Number(observedValue);
  const target=Number(targetValue);

  return direction==="HIGHER"
    ?observed>=target
    :observed<=target;
}

function closureEligibility({
  recoveryVerified,
  sloVerified,
  timelineComplete,
  postmortemEvidenceComplete
}){
  const gates={
    recoveryVerified:Boolean(recoveryVerified),
    sloVerified:Boolean(sloVerified),
    timelineComplete:Boolean(timelineComplete),
    postmortemEvidenceComplete:Boolean(postmortemEvidenceComplete)
  };

  return {
    gates,
    eligible:Object.values(gates).every(Boolean)
  };
}

function nextIncidentState({
  currentState,
  closureEligible
}){
  if(currentState==="OPEN"||currentState==="INVESTIGATING")
    return closureEligible?"RECOVERY_VERIFIED":currentState;

  if(currentState==="RECOVERY_VERIFIED")
    return closureEligible?"READY_FOR_CLOSURE":currentState;

  return currentState;
}

module.exports={
  sloHealthy,
  closureEligibility,
  nextIncidentState
};
