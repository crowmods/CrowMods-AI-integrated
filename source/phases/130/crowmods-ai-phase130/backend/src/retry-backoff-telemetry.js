function retryDelay({
  attempt,
  baseMs=25,
  maxMs=2000,
  jitterRatio=.25,
  random=Math.random
}){
  const exponential=Math.min(
    maxMs,
    baseMs*Math.pow(2,Math.max(0,attempt-1))
  );
  const jitter=exponential*jitterRatio*random();
  return Math.min(maxMs,Math.round(exponential+jitter));
}

function retryPlan({
  attempt,
  retryable=true,
  maxAttempts=3
}){
  if(!retryable || attempt>=maxAttempts)
    return {action:"ABORT"};

  return {
    action:"RETRY",
    delayMs:retryDelay({attempt})
  };
}

module.exports={retryDelay,retryPlan};
