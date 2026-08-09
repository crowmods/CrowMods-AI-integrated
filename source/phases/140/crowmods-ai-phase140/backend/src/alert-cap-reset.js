function evaluateCap({
 escalationCount=0,
 cap=3,
 resetAt,
 now=new Date(),
 resetWindowMs=3600000
}){
 const current=new Date(now);
 let count=Math.max(0,Number(escalationCount));
 let reset=new Date(resetAt);

 if(!Number.isFinite(reset.getTime())||reset<=current){
  count=0;
  reset=new Date(current.getTime()+resetWindowMs);
  return {
   action:"RESET",
   escalationCount:0,
   resetAt:reset.toISOString(),
   capped:false
  };
 }

 return {
  action:count>=Number(cap)?"CAP":"ALLOW",
  escalationCount:count,
  resetAt:reset.toISOString(),
  capped:count>=Number(cap)
 };
}
module.exports={evaluateCap};
