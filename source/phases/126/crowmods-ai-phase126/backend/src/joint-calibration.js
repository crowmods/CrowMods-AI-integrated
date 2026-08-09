function jointCalibration({
  currentSize,
  minWindow=50,
  maxWindow=1000,
  driftRatio=1,
  coverageError=0,
  driftExpandRatio=1.25,
  criticalDriftRatio=1.75,
  highCoverageError=.08,
  lowCoverageError=.02
}){
  if(!Number.isInteger(currentSize)||
     currentSize<minWindow||
     currentSize>maxWindow)
    return {
      status:"BLOCKED",
      reason:"invalid_window"
    };

  if(driftRatio>=criticalDriftRatio ||
     coverageError>=highCoverageError)
    return {
      status:"EXPAND",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentSize*1.5)
      ),
      reason:"critical_drift_or_coverage_error"
    };

  if(driftRatio>=driftExpandRatio ||
     coverageError>=highCoverageError/2)
    return {
      status:"EXPAND",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentSize*1.25)
      ),
      reason:"elevated_drift_or_coverage_error"
    };

  if(driftRatio<1.1 &&
     coverageError<=lowCoverageError)
    return {
      status:"SHRINK",
      windowSize:Math.max(
        minWindow,
        Math.floor(currentSize*.9)
      ),
      reason:"stable_model"
    };

  return {
    status:"HOLD",
    windowSize:currentSize,
    reason:"within_control_limits"
  };
}

module.exports={jointCalibration};
