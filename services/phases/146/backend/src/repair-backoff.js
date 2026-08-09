function scheduleBackoff({
 attempt=1,
 maxAttempts=3,
 baseDelayMs=1000,
 maxDelayMs=300000,
 now=new Date()
}){
 const n=Math.max(1,Number(attempt));
 const max=Math.max(1,Number(maxAttempts));

 if(n>max)
  return {state:"DEAD_LETTER",attempt:n};

 const delay=Math.min(
  Number(maxDelayMs),
  Number(baseDelayMs)*Math.pow(2,n-1)
 );

 return {
  state:"SCHEDULED",
  attempt:n,
  maxAttempts:max,
  nextAttemptAt:new Date(
   new Date(now).getTime()+delay
  ).toISOString(),
  delayMs:delay
 };
}
module.exports={scheduleBackoff};
