function calculateRetry({
  attempt,
  maxAttempts=5,
  baseDelaySeconds=10,
  maxDelaySeconds=900
}){
  if(attempt<1||maxAttempts<1)
    throw new Error("invalid_retry_policy");

  if(attempt>=maxAttempts)
    return {
      retry:false,
      reason:"retry_limit_reached"
    };

  const delay=Math.min(
    maxDelaySeconds,
    baseDelaySeconds*
      Math.pow(2,attempt-1)
  );

  return {
    retry:true,
    attempt:attempt+1,
    delaySeconds:delay
  };
}

module.exports={
  calculateRetry
};
