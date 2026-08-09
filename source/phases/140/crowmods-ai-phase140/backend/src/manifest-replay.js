function classifyReplay(existing,args){
 if(!existing) return {action:"NEW"};

 if(String(existing.exportId)!==String(args.exportId))
  return {action:"CONFLICT"};

 return {
  action:"REPLAY",
  result:existing.result,
  payloadHash:existing.payloadHash,
  manifestHash:existing.manifestHash
 };
}
module.exports={classifyReplay};
