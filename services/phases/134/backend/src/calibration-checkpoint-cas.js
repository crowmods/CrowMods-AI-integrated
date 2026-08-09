function commitCheckpoint({
  currentVersion,
  expectedVersion,
  action,
  windowSize,
  stableCycles
}){
  if(Number(currentVersion)!==Number(expectedVersion))
    return {
      status:"CONFLICT",
      reason:"checkpoint_version_mismatch",
      version:Number(currentVersion)
    };

  return {
    status:"COMMITTED",
    version:Number(expectedVersion)+1,
    action,
    windowSize,
    stableCycles
  };
}

module.exports={commitCheckpoint};
