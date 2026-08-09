function validateCanary({
  deadLetter,
  replayKey,
  canaryPercent=1,
  checks={}
}){
  if(!deadLetter||
     deadLetter.status!=="OPEN")
    return {
      status:"BLOCKED",
      reason:"dlq_item_not_open"
    };

  if(!replayKey||
     canaryPercent<=0||
     canaryPercent>100)
    return {
      status:"BLOCKED",
      reason:"invalid_canary_parameters"
    };

  const required=[
    "schemaValid",
    "dependenciesHealthy",
    "targetAvailable"
  ];

  const passed=required.every(
    key=>checks[key]===true
  );

  return {
    status:passed?"PASSED":"FAILED",
    replayKey,
    canaryPercent,
    checks
  };
}

module.exports={
  validateCanary
};
