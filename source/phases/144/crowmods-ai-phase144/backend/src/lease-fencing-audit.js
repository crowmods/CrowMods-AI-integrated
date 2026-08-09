const crypto=require("crypto");

function hashToken(token=""){
 return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function buildAudit({
 modelKey,
 ownerId,
 fencingVersion,
 leaseToken,
 oldExpiry=null,
 newExpiry=null,
 result
}){
 if(!modelKey||!ownerId||!leaseToken)
   return {status:"REJECTED"};

 return {
  status:"READY",
  modelKey,
  ownerId,
  fencingVersion:Number(fencingVersion),
  leaseTokenHash:hashToken(leaseToken),
  oldExpiry,
  newExpiry,
  result
 };
}
module.exports={buildAudit};
