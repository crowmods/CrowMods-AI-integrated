function updateBaseline({
 baselineRate=0,
 observedRate=0,
 sampleCount=0,
 alpha=.20
}){
 const a=Math.max(0,Math.min(1,Number(alpha)));
 const baseline=Number(baselineRate);
 const observed=Math.max(0,Number(observedRate));

 if(Number(sampleCount)<=0)
  return {
   baselineRate:observed,
   sampleCount:1
  };

 return {
  baselineRate:Number(
   ((1-a)*baseline+a*observed).toFixed(6)
  ),
  sampleCount:Number(sampleCount)+1
 };
}
module.exports={updateBaseline};
