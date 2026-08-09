function evaluatePromotion({
  checks={}
}){
  const required=[
    "schemaValid",
    "dependenciesHealthy",
    "targetAvailable",
    "rollbackReady",
    "observabilityReady"
  ];

  const passed=required.filter(
    key=>checks[key]===true
  ).length;

  const eligible=passed===required.length;

  return {
    status:eligible
      ?"ELIGIBLE"
      :"BLOCKED",
    requiredChecks:required.length,
    passedChecks:passed,
    failedChecks:required.filter(
      key=>checks[key]!==true
    )
  };
}

function promoteCanary({
  eligibility,
  authorizedBy
}){
  if(eligibility?.status!=="ELIGIBLE")
    return {
      status:"BLOCKED",
      reason:"promotion_gate_failed"
    };

  if(!authorizedBy)
    return {
      status:"BLOCKED",
      reason:"promotion_authorization_required"
    };

  return {
    status:"PROMOTED",
    authorizedBy
  };
}

module.exports={
  evaluatePromotion,
  promoteCanary
};
