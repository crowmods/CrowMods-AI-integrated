function wilson(successes,trials,z=1.96){
  if(trials<=0)
    return null;

  const p=successes/trials;
  const denom=1+(z*z/trials);
  const center=(p+(z*z/(2*trials)))/denom;
  const margin=(z*Math.sqrt(
    (p*(1-p)/trials)+(z*z/(4*trials*trials))
  ))/denom;

  return {
    lower:Math.max(0,center-margin),
    upper:Math.min(1,center+margin)
  };
}

function updateSequentialCoverage({
  coveredCount=0,
  sampleCount=0,
  additionalCovered=0,
  additionalSamples=0,
  targetCoverage=.9,
  tolerance=.03
}){
  const covered=Number(coveredCount)+Number(additionalCovered);
  const samples=Number(sampleCount)+Number(additionalSamples);

  if(samples<=0)
    return {
      status:"INSUFFICIENT_DATA",
      sampleCount:0,
      coveredCount:0
    };

  const coverage=covered/samples;
  const interval=wilson(covered,samples);

  let status="ON_TARGET";

  if(interval){
    if(interval.upper<targetCoverage-tolerance)
      status="UNDER_COVERED";
    else if(interval.lower>targetCoverage+tolerance)
      status="OVER_COVERED";
  }

  return {
    status,
    sampleCount:samples,
    coveredCount:covered,
    coverage:Number(coverage.toFixed(5)),
    lowerBound:Number(interval.lower.toFixed(5)),
    upperBound:Number(interval.upper.toFixed(5))
  };
}

module.exports={updateSequentialCoverage};
