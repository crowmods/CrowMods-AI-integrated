function wilson(successes,trials,z=1.96){
  if(trials<=0) return null;
  const p=successes/trials;
  const denom=1+z*z/trials;
  const center=(p+z*z/(2*trials))/denom;
  const margin=(z*Math.sqrt(
    p*(1-p)/trials + z*z/(4*trials*trials)
  ))/denom;
  return {
    lower:Math.max(0,center-margin),
    upper:Math.min(1,center+margin)
  };
}

function sequentialCalibration({
  coveredCount=0,
  sampleCount=0,
  targetCoverage=.9,
  tolerance=.03,
  currentWindow=100,
  minWindow=50,
  maxWindow=1000,
  additionalCovered=0,
  additionalSamples=0
}){
  const covered=Number(coveredCount)+Number(additionalCovered);
  const samples=Number(sampleCount)+Number(additionalSamples);

  if(samples<=0)
    return {
      action:"INSUFFICIENT_DATA",
      windowSize:Math.max(minWindow,currentWindow),
      sampleCount:0,
      coveredCount:0
    };

  const coverage=covered/samples;
  const interval=wilson(covered,samples);

  if(interval.upper<targetCoverage-tolerance)
    return {
      action:"EXPAND",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentWindow*1.5)
      ),
      sampleCount:samples,
      coveredCount:covered,
      coverage,
      lowerBound:interval.lower,
      upperBound:interval.upper
    };

  if(interval.lower>targetCoverage+tolerance)
    return {
      action:"SHRINK",
      windowSize:Math.max(
        minWindow,
        Math.floor(currentWindow*.9)
      ),
      sampleCount:samples,
      coveredCount:covered,
      coverage,
      lowerBound:interval.lower,
      upperBound:interval.upper
    };

  return {
    action:"HOLD",
    windowSize:currentWindow,
    sampleCount:samples,
    coveredCount:covered,
    coverage,
    lowerBound:interval.lower,
    upperBound:interval.upper
  };
}

module.exports={sequentialCalibration};
