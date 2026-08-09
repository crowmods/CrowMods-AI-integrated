function recoverCalibration({
  persistedAction="HOLD",
  persistedWindow=100,
  persistedStableCycles=0,
  checkpointVersion=0,
  requestedVersion=0,
  minWindow=50,
  maxWindow=1000
}){
  if(Number(requestedVersion)<Number(checkpointVersion))
    return {status:"REJECTED",reason:"stale_checkpoint"};

  return {
    status:"RECOVERED",
    action:persistedAction,
    windowSize:Math.min(maxWindow,Math.max(minWindow,Number(persistedWindow))),
    stableCycles:Math.max(0,Number(persistedStableCycles)),
    checkpointVersion:Number(checkpointVersion)
  };
}
module.exports={recoverCalibration};
