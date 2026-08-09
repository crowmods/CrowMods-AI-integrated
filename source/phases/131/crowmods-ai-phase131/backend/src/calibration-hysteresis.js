function hysteresis({
 action,
 previousAction="HOLD",
 stableCycles=0,
 requiredCycles=2,
 lowerBound,
 upperBound,
 windowSize,
 minWindow=50,
 maxWindow=1000
}){
 if(action==="INSUFFICIENT_DATA") return {action,stableCycles:0,windowSize};
 if(action===previousAction){
   const cycles=stableCycles+1;
   if(cycles<requiredCycles) return {action:"HOLD",stableCycles:cycles,windowSize};
   if(action==="EXPAND") return {action,stableCycles:cycles,windowSize:Math.min(maxWindow,Math.ceil(windowSize*1.5)),lowerBound,upperBound};
   if(action==="SHRINK") return {action,stableCycles:cycles,windowSize:Math.max(minWindow,Math.floor(windowSize*.9)),lowerBound,upperBound};
 }
 return {action:"HOLD",stableCycles:1,windowSize,lowerBound,upperBound};
}
module.exports={hysteresis};
