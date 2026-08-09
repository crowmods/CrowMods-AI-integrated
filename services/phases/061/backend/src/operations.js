const CHECKLIST=[
  ["dns","DNS configured"],
  ["tls","TLS verified"],
  ["secrets","Secrets configured"],
  ["database","Database healthy"],
  ["queue","Queue healthy"],
  ["monitoring","Monitoring enabled"],
  ["backup","Backup verified"],
  ["artifact","Artifact verified"],
  ["staging","Staging verified"],
  ["canary","Canary verified"],
  ["approval","Production approval recorded"]
];

function checklistReady(items=[]){
  const required=items.filter(x=>x.required!==false);
  return required.length>0 && required.every(x=>x.completed===true);
}

function evaluateSlo({
  errorRate,
  latencyMs,
  healthPassRate,
  maxErrorRate=0.02,
  maxLatencyMs=1000,
  minHealthPassRate=0.99
}){
  const checks={
    errorRate:Number(errorRate)<=maxErrorRate,
    latencyMs:Number(latencyMs)<=maxLatencyMs,
    healthPassRate:Number(healthPassRate)>=minHealthPassRate
  };

  const healthy=Object.values(checks).every(Boolean);

  return {
    healthy,
    recommendation:healthy?"CONTINUE":"INVESTIGATE_OR_ROLLBACK",
    checks
  };
}

module.exports={CHECKLIST,checklistReady,evaluateSlo};
