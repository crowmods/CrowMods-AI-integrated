const ALLOWED=new Set([
 "alert_ack_history",
 "retry_latency_samples",
 "alert_review_queries"
]);

function validateBatch({tableName,retentionDays,batchSize}){
 if(!ALLOWED.has(tableName))
   return {status:"DENIED",reason:"table_not_allowlisted"};

 const days=Number(retentionDays);
 const size=Number(batchSize);

 if(!Number.isFinite(days)||days<=0)
   return {status:"DENIED",reason:"invalid_retention_days"};

 if(!Number.isFinite(size)||size<=0)
   return {status:"DENIED",reason:"invalid_batch_size"};

 return {
  status:"AUTHORIZED",
  tableName,
  retentionDays:Math.floor(days),
  batchSize:Math.min(1000,Math.floor(size))
 };
}

module.exports={validateBatch};
