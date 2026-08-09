function executeRepair({
 attempt=1,
 maxAttempts=3,
 repairable=true,
 detail=""
}){
 const n=Math.max(1,Number(attempt));
 const max=Math.max(1,Number(maxAttempts));

 if(!repairable)
   return {outcome:"REJECTED",attempt:n,detail:"not_repairable"};

 if(n>=max)
   return {outcome:"FAILED",attempt:n,detail};

 return {outcome:"REPAIRED",attempt:n,detail};
}
module.exports={executeRepair};
