function replayDecision({
  status,
  attempts,
  maxAttempts
}){
  if(status!=="PENDING")return "SKIP";
  if(attempts>=maxAttempts)return "FAIL";
  return "REPLAY";
}

module.exports={replayDecision};
