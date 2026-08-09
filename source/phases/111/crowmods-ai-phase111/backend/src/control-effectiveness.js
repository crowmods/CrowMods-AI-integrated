function evaluateControl({
  totalTests,
  passedTests,
  targetPercent
}){
  if(totalTests<=0)
    return {
      status:"BLOCKED",
      effectivenessPercent:null
    };

  if(passedTests<0||passedTests>totalTests)
    throw new Error(
      "invalid_control_test_counts"
    );

  const effectiveness=Number(
    ((passedTests/totalTests)*100)
      .toFixed(3)
  );

  let status="EFFECTIVE";

  if(effectiveness<targetPercent)
    status="DEGRADED";

  if(effectiveness<targetPercent*0.8)
    status="INEFFECTIVE";

  return {
    status,
    effectivenessPercent:effectiveness,
    targetPercent
  };
}

module.exports={
  evaluateControl
};
