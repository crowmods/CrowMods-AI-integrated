function calculateConfidence({
 samples=[],
 z=1.96
}){
 const values=samples.map(Number)
  .filter(Number.isFinite);

 const n=values.length;

 if(!n)
  return {
   sampleCount:0,
   meanRate:0,
   variance:0,
   lowerBound:0,
   upperBound:0
  };

 const mean=values.reduce((a,b)=>a+b,0)/n;
 const variance=n>1
  ?values.reduce((a,b)=>a+Math.pow(b-mean,2),0)/(n-1)
  :0;

 const se=Math.sqrt(variance/n);
 const margin=Number(z)*se;

 return {
  sampleCount:n,
  meanRate:Number(mean.toFixed(6)),
  variance:Number(variance.toFixed(10)),
  lowerBound:Number(
   Math.max(0,mean-margin).toFixed(6)
  ),
  upperBound:Number(
   Math.min(1,mean+margin).toFixed(6)
  )
 };
}
module.exports={calculateConfidence};
