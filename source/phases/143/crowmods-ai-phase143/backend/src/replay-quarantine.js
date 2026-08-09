function classifyConflict({
 existingExportId,
 requestedExportId,
 idempotencyKey,
 payloadHash="",
 manifestHash=""
}){
 if(!idempotencyKey)
   return {action:"DENIED",reason:"missing_idempotency_key"};

 if(String(existingExportId)===String(requestedExportId))
   return {action:"REPLAY"};

 return {
  action:"QUARANTINE",
  reason:"idempotency_key_export_conflict",
  idempotencyKey,
  exportId:String(requestedExportId),
  payloadHash,
  manifestHash
 };
}
module.exports={classifyConflict};
