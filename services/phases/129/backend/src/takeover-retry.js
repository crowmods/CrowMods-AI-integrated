async function takeoverWithRetry({
  execute,
  maxAttempts=3,
  sleep=async()=>{},
  isRetryable=error=>error?.code==="40001"
}){
  let lastError;

  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      const result=await execute(attempt);

      if(result?.status==="TAKEN_OVER")
        return {
          status:"TAKEN_OVER",
          attempt,
          result
        };

      if(result?.status==="CONFLICT")
        return {
          status:"CONFLICT",
          attempt,
          result
        };

      return {
        status:"ABORTED",
        attempt,
        result
      };
    }catch(error){
      lastError=error;

      if(!isRetryable(error) ||
         attempt===maxAttempts)
        return {
          status:"ABORTED",
          attempt,
          reason:"retry_budget_exhausted",
          error
        };

      await sleep(25*Math.pow(2,attempt-1));
    }
  }

  return {
    status:"ABORTED",
    reason:"retry_budget_exhausted",
    error:lastError
  };
}

module.exports={takeoverWithRetry};
