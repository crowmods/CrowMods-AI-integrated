function classifyConflict({
 modelKey,
 ownerId=null,
 fencingVersion=null,
 conflictType
}){
 const allowed=new Set([
  "OWNER_MISMATCH",
  "FENCING_MISMATCH",
  "LEASE_EXPIRED",
  "CHECKPOINT_CONFLICT"
 ]);

 if(!modelKey||!allowed.has(conflictType))
   return {status:"REJECTED"};

 return {
  status:"RECORDED",
  modelKey,
  ownerId,
  fencingVersion:
   fencingVersion==null?null:Number(fencingVersion),
  conflictType
 };
}
module.exports={classifyConflict};
