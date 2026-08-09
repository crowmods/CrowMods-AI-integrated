function buildOutcome({
 runId,recordKey,tableName,outcome,auditId=null
}){
 if(!runId||recordKey===undefined||!tableName)
   return {status:"REJECTED"};

 const allowed=new Set(["PURGED","SKIPPED","FAILED"]);
 if(!allowed.has(outcome))
   return {status:"REJECTED",reason:"invalid_outcome"};

 return {
  status:"READY",
  runId,
  recordKey:String(recordKey),
  tableName,
  outcome,
  auditId
 };
}
module.exports={buildOutcome};
