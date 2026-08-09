function calculateJitteredRetry({
  attempt,
  maxAttempts=5,
  baseDelaySeconds=10,
  maxDelaySeconds=900,
  jitterRatio=.25,
  random=Math.random
}){
  if(attempt<1||
     maxAttempts<1||
     jitterRatio<0||
     jitterRatio>1)
    throw new Error("invalid_retry_parameters");

  if(attempt>=maxAttempts)
    return {
      retry:false,
      deadLetter:true,
      reason:"retry_limit_reached"
    };

  const exponential=Math.min(
    maxDelaySeconds,
    baseDelaySeconds*
      Math.pow(2,attempt-1)
  );

  const delta=
    exponential*jitterRatio;

  const jitter=
    (random()*2-1)*delta;

  const delay=Math.max(
    0,
    Math.min(
      maxDelaySeconds,
      Math.round(exponential+jitter)
    )
  );

  return {
    retry:true,
    deadLetter:false,
    attempt:attempt+1,
    delaySeconds:delay
  };
}

module.exports={
  calculateJitteredRetry
};
