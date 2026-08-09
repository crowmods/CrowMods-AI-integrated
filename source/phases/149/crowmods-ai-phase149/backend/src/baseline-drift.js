function updateWithDriftControl({
 baselineRate=0,
 candidateRate=0,
 minRate=0,
 maxRate=1,
 maxStep=.05
}){
 const baseline=Math.min(
  Number(maxRate),
  Math.max(Number(minRate),Number(baselineRate))
 );
 const candidate=Math.min(
  Number(maxRate),
  Math.max(Number(minRate),Number(candidateRate))
 );
 const step=Math.max(0,Number(maxStep));
 const delta=Math.max(-step,Math.min(step,candidate-baseline));

 return {
  baselineRate:Number((baseline+delta).toFixed(6)),
  appliedStep:Number(delta.toFixed(6)),
  candidateRate:candidate
 };
}
module.exports={updateWithDriftControl};
