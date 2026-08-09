function applyDeadband({
 action,
 expandThreshold,
 shrinkThreshold,
 consecutiveExpand=0,
 consecutiveShrink=0,
 requiredCycles=3,
 windowSize=100,
 minWindow=50,
 maxWindow=1000
}){
 let ce=consecutiveExpand, cs=consecutiveShrink;
 if(action==="EXPAND" && expandThreshold>=0){ce++;cs=0;}
 else if(action==="SHRINK" && shrinkThreshold>=0){cs++;ce=0;}
 else {ce=0;cs=0;}

 if(ce>=requiredCycles)
   return {action:"EXPAND",consecutiveExpand:ce,consecutiveShrink:cs,
     windowSize:Math.min(maxWindow,Math.ceil(windowSize*1.5))};
 if(cs>=requiredCycles)
   return {action:"SHRINK",consecutiveExpand:ce,consecutiveShrink:cs,
     windowSize:Math.max(minWindow,Math.floor(windowSize*.9))};

 return {action:"HOLD",consecutiveExpand:ce,consecutiveShrink:cs,windowSize};
}
module.exports={applyDeadband};
