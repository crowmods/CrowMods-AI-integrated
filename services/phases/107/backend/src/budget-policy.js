function decidePolicy({
  budgetStatus,
  highestSeverity,
  changeInProgress=false
}){
  if(budgetStatus==="BLOCKED")
    return {
      decision:"ESCALATE",
      reason:"budget_measurement_unavailable"
    };

  if(highestSeverity==="CRITICAL")
    return {
      decision:"ESCALATE",
      reason:"critical_burn_rate"
    };

  if(budgetStatus==="EXHAUSTED")
    return {
      decision:"FREEZE_CHANGE",
      reason:"error_budget_exhausted"
    };

  if(budgetStatus==="WARNING"||
     highestSeverity==="HIGH")
    return {
      decision:"WARN",
      reason:changeInProgress
        ?"elevated_risk_during_change"
        :"error_budget_warning"
    };

  return {
    decision:"CONTINUE",
    reason:"within_operational_budget"
  };
}

module.exports={
  decidePolicy
};
