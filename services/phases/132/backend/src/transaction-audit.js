function buildAuditLink({workerKey,operation,expectedVersion,committedVersion,result,eventId}){
 return {
   workerKey,operation,
   expectedVersion:Number(expectedVersion),
   committedVersion:committedVersion==null?null:Number(committedVersion),
   result,eventId:eventId||null
 };
}
module.exports={buildAuditLink};
