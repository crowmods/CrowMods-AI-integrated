function backoffDelay({
  attempt,
  baseMs=50,
  maxMs=2000,
  jitterRatio=.25,
  random=Math.random
}){
  const exponential=Math.min(
    maxMs,
    baseMs*Math.pow(2,Math.max(0,attempt-1))
  );
  const jitter=exponential*jitterRatio*random();
  return Math.min(
    maxMs,
    Math.round(exponential+jitter)
  );
}

async function runWithSerializableRetry({
  operation,
  maxAttempts=4,
  baseMs=50,
  maxMs=2000,
  sleep=ms=>new Promise(r=>setTimeout(r,ms)),
  onAttempt=()=>{}
}){
  if(typeof operation!=="function")
    throw new TypeError("operation_required");

  let lastError;

  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      onAttempt({attempt,outcome:"ATTEMPT"});
      return {
        status:"COMMITTED",
        attempt,
        value:await operation(attempt)
      };
    }catch(error){
      lastError=error;

      const retryable=
        error?.code==="40001" ||
        error?.serializationFailure===true;

      if(!retryable || attempt===maxAttempts)
        return {
          status:"ABORTED",
          attempt,
          reason:retryable
            ?"retry_budget_exhausted"
            :"non_retryable_error",
          error
        };

      const delayMs=backoffDelay({
        attempt,
        baseMs,
        maxMs
      });

      onAttempt({
        attempt,
        outcome:"RETRY",
        delayMs
      });

      await sleep(delayMs);
    }
  }

  return {
    status:"ABORTED",
    reason:"retry_budget_exhausted",
    error:lastError
  };
}

module.exports={
  backoffDelay,
  runWithSerializableRetry
};
