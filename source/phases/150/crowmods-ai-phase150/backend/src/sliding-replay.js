function evaluateSlidingWindow({
 windowStart,
 now=new Date(),
 windowSeconds=60,
 requestCount=0,
 limitCount=5,
 escalationMultiplier=2
}){
 const start=new Date(windowStart);
 const current=new Date(now);

 if(!Number.isFinite(start.getTime()))
  return {state:"ESCALATED",reason:"invalid_window"};

 const elapsed=(current.getTime()-start.getTime())/1000;

 if(elapsed>=Number(windowSeconds))
  return {
   state:"ALLOW",
   requestCount:1,
   windowReset:true
  };

 const next=Number(requestCount)+1;
 const limit=Math.max(1,Number(limitCount));

 if(next>=limit*Number(escalationMultiplier))
  return {state:"ESCALATED",requestCount:next};

 if(next>=limit)
  return {state:"THROTTLED",requestCount:next};

 return {state:"ALLOW",requestCount:next};
}
module.exports={evaluateSlidingWindow};
