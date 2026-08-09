function approvalRequired({
  dryRun,
  environment
}){
  return !dryRun || environment==="production";
}

function canStart({
  approved,
  replicationHealthy,
  trafficHealthy,
  dryRun,
  environment
}){
  const approvalOk=
    approvalRequired({dryRun,environment})
      ?Boolean(approved)
      :true;

  return Boolean(
    approvalOk&&
    replicationHealthy&&
    trafficHealthy
  );
}

function reportFromSteps(steps){
  const passed=steps.filter(
    s=>s.status==="PASSED"
  ).length;

  const failed=steps.filter(
    s=>s.status==="FAILED"
  ).length;

  const rollbackCount=steps.filter(
    s=>s.status==="ROLLED_BACK"
  ).length;

  return {
    passedSteps:passed,
    failedSteps:failed,
    rollbackCount,
    overallPassed:failed===0
  };
}

module.exports={
  approvalRequired,
  canStart,
  reportFromSteps
};
