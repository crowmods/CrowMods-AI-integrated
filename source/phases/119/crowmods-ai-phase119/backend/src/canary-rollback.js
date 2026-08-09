function decideCanaryRollout({
  checks={},
  errorRate=0,
  latencyRegression=0,
  rollbackThresholds={
    maxErrorRate:5,
    maxLatencyRegression:20
  }
}){
  const required=[
    "schemaValid",
    "dependenciesHealthy",
    "targetAvailable",
    "rollbackReady",
    "observabilityReady"
  ];

  const failedChecks=required.filter(
    key=>checks[key]!==true
  );

  if(failedChecks.length>0)
    return {
      decision:"ROLLBACK",
      reason:"promotion_checks_failed",
      passedChecks:
        required.length-failedChecks.length,
      failedChecks
    };

  if(errorRate>rollbackThresholds.maxErrorRate)
    return {
      decision:"ROLLBACK",
      reason:"error_rate_threshold_exceeded",
      passedChecks:required.length,
      failedChecks:[]
    };

  if(latencyRegression>
     rollbackThresholds.maxLatencyRegression)
    return {
      decision:"ROLLBACK",
      reason:"latency_regression_threshold_exceeded",
      passedChecks:required.length,
      failedChecks:[]
    };

  return {
    decision:"PROMOTE",
    reason:"all_rollout_gates_passed",
    passedChecks:required.length,
    failedChecks:[]
  };
}

module.exports={
  decideCanaryRollout
};
