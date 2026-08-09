function buildDeleteRequest({
 tableName,
 retentionDays=30,
 batchSize=100
}){
 const allowed=new Set([
  "alert_ack_history",
  "retry_latency_samples"
 ]);

 if(!allowed.has(tableName))
   return {status:"DENIED",reason:"table_not_allowlisted"};

 const days=Number(retentionDays);
 const size=Number(batchSize);

 if(!Number.isFinite(days)||days<=0||
    !Number.isFinite(size)||size<=0)
   return {status:"DENIED",reason:"invalid_parameters"};

 return {
  status:"AUTHORIZED",
  tableName,
  retentionDays:Math.floor(days),
  batchSize:Math.min(500,Math.floor(size)),
  lockMode:"FOR UPDATE SKIP LOCKED",
  transactional:true
 };
}
module.exports={buildDeleteRequest};
