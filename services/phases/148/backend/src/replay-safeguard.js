function classifyReplay({
 existingExportId=null,
 requestedExportId,
 payloadHash="",
 existingPayloadHash="",
 manifestHash="",
 existingManifestHash=""
}){
 if(!requestedExportId)
  return {state:"BLOCKED",reason:"missing_export_id"};

 if(existingExportId===null)
  return {state:"ALLOW"};

 if(String(existingExportId)!==String(requestedExportId))
  return {state:"CONFLICT",reason:"export_identity_conflict"};

 if(existingPayloadHash &&
    payloadHash &&
    existingPayloadHash!==payloadHash)
  return {state:"CONFLICT",reason:"payload_hash_conflict"};

 if(existingManifestHash &&
    manifestHash &&
    existingManifestHash!==manifestHash)
  return {state:"CONFLICT",reason:"manifest_hash_conflict"};

 return {state:"REPLAY"};
}
module.exports={classifyReplay};
