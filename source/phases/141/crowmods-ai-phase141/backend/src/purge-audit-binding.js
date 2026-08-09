function buildRowAudit({
 runId,tableName,recordKey,retentionDays,action
}){
 if(!runId||!tableName||recordKey===undefined)
   return {status:"REJECTED"};

 return {
  status:"READY",
  runId,
  tableName,
  recordKey:String(recordKey),
  retentionDays:Number(retentionDays),
  action
 };
}
module.exports={buildRowAudit};
