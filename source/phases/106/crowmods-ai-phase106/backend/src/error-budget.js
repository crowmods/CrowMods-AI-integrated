function allowedFailurePercent(targetPercent){
  return Number(
    (100-targetPercent).toFixed(3)
  );
}

function calculateBudget({
  targetPercent,
  total,
  failures
}){
  if(total<=0)
    return {
      status:"BLOCKED",
      allowedFailurePercent:
        allowedFailurePercent(targetPercent),
      consumedFailurePercent:null,
      remainingBudgetPercent:null
    };

  if(failures<0||failures>total)
    throw new Error("invalid_failure_count");

  const allowed=allowedFailurePercent(
    targetPercent
  );

  const consumed=Number(
    ((failures/total)*100).toFixed(3)
  );

  const remaining=Number(
    Math.max(0,allowed-consumed).toFixed(3)
  );

  let status="HEALTHY";
  if(consumed>=allowed) status="EXHAUSTED";
  else if(consumed>=allowed*0.8) status="WARNING";

  return {
    status,
    allowedFailurePercent:allowed,
    consumedFailurePercent:consumed,
    remainingBudgetPercent:remaining
  };
}

function burnRate({
  targetPercent,
  observedSuccessPercent
}){
  const allowedFailure=100-targetPercent;
  const observedFailure=
    100-observedSuccessPercent;

  if(allowedFailure<=0)
    return null;

  return Number(
    (observedFailure/allowedFailure).toFixed(3)
  );
}

function burnSeverity(rate){
  if(rate===null) return "INFO";
  if(rate>=14.4) return "CRITICAL";
  if(rate>=6) return "HIGH";
  if(rate>=2) return "MEDIUM";
  return "INFO";
}

function evaluateBurn({
  targetPercent,
  observedSuccessPercent,
  windowMinutes
}){
  const rate=burnRate({
    targetPercent,
    observedSuccessPercent
  });

  const severity=burnSeverity(rate);

  return {
    windowMinutes,
    burnRate:rate,
    severity,
    status:
      severity==="INFO"
        ?"NORMAL"
        :"ALERT"
  };
}

module.exports={
  allowedFailurePercent,
  calculateBudget,
  burnRate,
  burnSeverity,
  evaluateBurn
};
