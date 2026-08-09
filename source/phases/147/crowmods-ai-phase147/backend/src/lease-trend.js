function detectTrend({
 observedRate=0,
 baselineRate=0,
 spikeMultiplier=3,
 elevatedMultiplier=1.5
}){
 const observed=Math.max(0,Number(observedRate));
 const baseline=Math.max(0,Number(baselineRate));

 if(baseline===0)
  return {
   state:observed>0?"SPIKE":"NORMAL",
   deltaRatio:observed>0?Infinity:0
  };

 const ratio=observed/baseline;

 return {
  state:ratio>=Number(spikeMultiplier)
   ?"SPIKE"
   :ratio>=Number(elevatedMultiplier)
    ?"ELEVATED":"NORMAL",
  deltaRatio:Number((ratio-1).toFixed(6))
 };
}
module.exports={detectTrend};
