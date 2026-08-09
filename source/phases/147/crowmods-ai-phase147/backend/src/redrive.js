function authorizeRedrive({
 status="DEAD_LETTER",
 actorId,
 currentAttempt=0,
 maxAttempts=3,
 reason=""
}){
 if(status!=="DEAD_LETTER"||!actorId||!reason)
  return {status:"REJECTED"};

 const attempt=Number(currentAttempt)+1;
 const max=Math.max(1,Number(maxAttempts));

 if(attempt>max)
  return {status:"REJECTED",reason:"attempt_limit_reached"};

 return {
  status:"AUTHORIZED",
  action:"REDRIVE",
  targetAttempt:attempt,
  actorId,
  reason
 };
}
module.exports={authorizeRedrive};
