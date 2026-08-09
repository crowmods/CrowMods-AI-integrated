function chooseCalibrationAction({
  sampleCount,
  coverage,
  lowerBound,
  upperBound,
  targetCoverage=.9,
  tolerance=.03,
  minWindow=50,
  currentWindow=100,
  maxWindow=1000
}){
  if(Number(sampleCount)<=0 ||
     !Number.isFinite(coverage) ||
     !Number.isFinite(lowerBound) ||
     !Number.isFinite(upperBound))
    return {
      action:"INSUFFICIENT_DATA",
      windowSize:Math.max(minWindow,currentWindow)
    };

  if(upperBound<targetCoverage-tolerance)
    return {
      action:"EXPAND",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentWindow*1.5)
      ),
      reason:"confidence_interval_below_target"
    };

  if(lowerBound>targetCoverage+tolerance)
    return {
      action:"SHRINK",
      windowSize:Math.max(
        minWindow,
        Math.floor(currentWindow*.9)
      ),
      reason:"confidence_interval_above_target"
    };

  return {
    action:"HOLD",
    windowSize:currentWindow,
    reason:"confidence_interval_within_target"
  };
}

module.exports={chooseCalibrationAction};
