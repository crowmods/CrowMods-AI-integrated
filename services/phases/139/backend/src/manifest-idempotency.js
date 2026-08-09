function checkIdempotency(existing,args){
 if(existing){
  if(existing.exportId!==args.exportId)
   return {status:"CONFLICT",reason:"idempotency_key_reused"};
  return {
   status:"REPLAY",
   result:existing.result,
   payloadHash:existing.payloadHash,
   manifestHash:existing.manifestHash
  };
 }
 return {status:"NEW"};
}
module.exports={checkIdempotency};
