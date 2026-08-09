function validateBinding({
 modelKey,
 ownerId,
 fencingVersion,
 checkpointVersion,
 expectedFencingVersion,
 expectedOwnerId
}){
 if(!modelKey||!ownerId)
   return {status:"DENIED",reason:"missing_identity"};

 if(ownerId!==expectedOwnerId)
   return {status:"CONFLICT",reason:"owner_mismatch"};

 if(Number(fencingVersion)!==Number(expectedFencingVersion))
   return {status:"CONFLICT",reason:"fencing_mismatch"};

 return {
  status:"BOUND",
  modelKey,
  ownerId,
  fencingVersion:Number(fencingVersion),
  checkpointVersion:Number(checkpointVersion)
 };
}
module.exports={validateBinding};
