function retryDelay(attempt){
  return Math.min(
    15*60*1000,
    1000*Math.pow(2,Math.max(0,attempt-1))
  );
}

function deliveryDecision(attempt,maxAttempts){
  return attempt>=maxAttempts?"DLQ":"RETRY";
}

module.exports={retryDelay,deliveryDecision};
