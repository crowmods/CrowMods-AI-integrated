function buildRepairItem({
 runId,recordKey,mismatchType
}){
 if(!runId||recordKey===undefined||!mismatchType)
   return {status:"REJECTED"};

 return {
  status:"READY",
  runId,
  recordKey:String(recordKey),
  mismatchType
 };
}

function claim(item,workerId){
 if(!item||item.status!=="OPEN"||!workerId)
   return {status:"CONFLICT"};

 return {
  status:"CLAIMED",
  claimedBy:workerId,
  attempts:Number(item.attempts||0)+1
 };
}
module.exports={buildRepairItem,claim};
