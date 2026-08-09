function checkRateLimit({
 requestCount=0,
 limitCount=5,
 escalationThreshold=2
}){
 const count=Math.max(0,Number(requestCount));
 const limit=Math.max(1,Number(limitCount));

 if(count>=limit*Number(escalationThreshold))
  return {state:"ESCALATED",requestCount:count,limitCount:limit};

 if(count>=limit)
  return {state:"THROTTLED",requestCount:count,limitCount:limit};

 return {state:"ALLOW",requestCount:count,limitCount:limit};
}
module.exports={checkRateLimit};
