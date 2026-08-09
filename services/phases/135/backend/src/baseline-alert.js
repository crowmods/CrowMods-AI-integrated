function classifyBaseline({
 currentP95,
 baselineP95,
 warningRatio=1.25,
 criticalRatio=1.75
}){
 const current=Number(currentP95);
 const baseline=Number(baselineP95);
 if(!Number.isFinite(current)||!Number.isFinite(baseline)||baseline<=0)
   return {severity:"NORMAL",deviationRatio:null};

 const ratio=current/baseline;
 const severity=ratio>=criticalRatio
   ?"CRITICAL"
   :ratio>=warningRatio
    ?"WARNING":"NORMAL";

 return {
   severity,
   deviationRatio:Number(ratio.toFixed(5))
 };
}

module.exports={classifyBaseline};
