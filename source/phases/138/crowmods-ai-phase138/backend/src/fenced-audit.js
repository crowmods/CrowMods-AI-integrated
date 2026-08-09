function buildFencedAudit({
 modelKey,
 ownerId,
 fencingVersion,
 checkpointVersion,
 result
}){
 if(!modelKey||!ownerId)
   return {status:"REJECTED"};

 return {
  status:"READY",
  modelKey,
  ownerId,
  fencingVersion:Number(fencingVersion),
  checkpointVersion:Number(checkpointVersion),
  result
 };
}

module.exports={buildFencedAudit};
