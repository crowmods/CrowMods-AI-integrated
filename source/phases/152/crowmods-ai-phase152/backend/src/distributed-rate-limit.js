function evaluate({
 elapsedSeconds,
 requestCount=0,
 limitCount=5,
 windowSeconds=60,
 escalationMultiplier=2
}){
 const elapsed=Number(elapsedSeconds);
 const limit=Math.max(1,Number(limitCount));
 const window=Math.max(1,Number(windowSeconds));

 if(!Number.isFinite(elapsed)||elapsed<0)
  return {state:"ESCALATED",reason:"invalid_window"};

 if(elapsed>=window)
  return {
   state:"ALLOW",
   requestCount:1,
   reset:true
  };

 const next=Math.max(0,Number(requestCount))+1;

 if(next>=limit*Number(escalationMultiplier))
  return {state:"ESCALATED",requestCount:next};

 if(next>=limit)
  return {state:"THROTTLED",requestCount:next};

 return {state:"ALLOW",requestCount:next};
}

module.exports={evaluate};
