function selectWindow({
  currentSize,
  minWindow=50,
  maxWindow=1000,
  driftRatio=1,
  coverageError=0,
  targetCoverage=.9
}){
  if(!Number.isInteger(currentSize)||
     currentSize<minWindow||
     currentSize>maxWindow)
    return {
      status:"BLOCKED",
      reason:"invalid_window"
    };

  const absCoverageError=Math.abs(
    Number(coverageError)
  );

  if(driftRatio>=1.75)
    return {
      status:"EXPAND_AGGRESSIVELY",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentSize*1.5)
      ),
      reason:"critical_model_drift"
    };

  if(driftRatio>=1.25 ||
     absCoverageError>.08)
    return {
      status:"EXPAND",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentSize*1.25)
      ),
      reason:"drift_or_coverage_error"
    };

  if(absCoverageError<.02 &&
     driftRatio<1.1)
    return {
      status:"SHRINK",
      windowSize:Math.max(
        minWindow,
        Math.floor(currentSize*.9)
      ),
      reason:"stable_calibration"
    };

  return {
    status:"HOLD",
    windowSize:currentSize,
    targetCoverage,
    reason:"within_calibration_tolerance"
  };
}

module.exports={selectWindow};
