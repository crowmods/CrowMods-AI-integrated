function resolve({
 quarantineId,
 operatorId,
 decision,
 reason
}){
 const allowed=new Set(["RELEASE","REJECT","REPROCESS"]);
 if(!quarantineId||!operatorId||!allowed.has(decision)||!reason)
   return {status:"REJECTED"};

 return {
  status:"RESOLVED",
  quarantineId,
  operatorId,
  decision,
  reason
 };
}
module.exports={resolve};
