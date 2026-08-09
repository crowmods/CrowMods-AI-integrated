function calculateBurnRate({
 complianceRatio=1,
 targetRatio=0.99,
 threshold=2
}){
 const target=Math.max(0.00001,Number(targetRatio));
 const compliance=Math.max(0,Math.min(1,Number(complianceRatio)));
 const errorBudget=1-target;
 const observedError=1-compliance;
 const burn=errorBudget>0?observedError/errorBudget:0;

 return {
  complianceRatio:compliance,
  burnRate:Number(burn.toFixed(5)),
  threshold:Number(threshold),
  state:burn>=Number(threshold)?"BREACH":"NORMAL"
 };
}
module.exports={calculateBurnRate};
