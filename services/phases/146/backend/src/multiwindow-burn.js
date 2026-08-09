const {calculateBurnRate}=require("./burn-rate");

function evaluateWindows(windows=[],policy={}){
 return windows.map(w=>{
  const r=calculateBurnRate({
   complianceRatio:w.complianceRatio,
   targetRatio:policy.targetRatio||.99,
   threshold:policy.threshold||2
  });

  return {
   windowMinutes:Number(w.windowMinutes),
   ...r
  };
 });
}

function overallState(results=[]){
 return results.some(r=>r.state==="BREACH")
  ?"BREACH":"NORMAL";
}
module.exports={evaluateWindows,overallState};
