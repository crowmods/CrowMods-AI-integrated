function validatePolicy({
 version,
 breachThreshold,
 recoveryThreshold
}){
 const v=Math.max(1,Number(version));
 const breach=Math.max(1,Number(breachThreshold));
 const recovery=Math.max(1,Number(recoveryThreshold));

 if(recovery<breach)
  return {status:"REJECTED",reason:"invalid_threshold_order"};

 return {
  status:"VALID",
  version:v,
  breachThreshold:breach,
  recoveryThreshold:recovery
 };
}
module.exports={validatePolicy};
