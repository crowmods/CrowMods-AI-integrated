function sampleHealthy({
  workers,
  expectedWorkers,
  lag,
  previousLag,
  errorRate,
  maxErrorRate=.02
}){
  return Number(workers)>=Number(expectedWorkers) &&
    Number(lag)<=Number(previousLag) &&
    Number(errorRate)<=Number(maxErrorRate);
}

function confidenceScore({
  healthySamples,
  unhealthySamples,
  minimumSamples=5
}){
  const total=Number(healthySamples)+Number(unhealthySamples);

  if(total===0)
    return 0;

  const base=Number(healthySamples)/total;
  const maturity=Math.min(1,total/Number(minimumSamples));

  return Number((base*maturity).toFixed(4));
}

function recoveryState({
  healthySamples,
  unhealthySamples,
  confidence,
  requiredHealthySamples=3,
  maxUnhealthySamples=2,
  minimumConfidence=.8
}){
  if(
    healthySamples>=requiredHealthySamples &&
    confidence>=minimumConfidence
  ){
    return {
      state:"RECOVERED",
      closureEligible:true
    };
  }

  if(unhealthySamples>=maxUnhealthySamples)
    return {
      state:"ROLLBACK_RECOMMENDED",
      closureEligible:false
    };

  return {
    state:"VERIFYING",
    closureEligible:false
  };
}

module.exports={
  sampleHealthy,
  confidenceScore,
  recoveryState
};
