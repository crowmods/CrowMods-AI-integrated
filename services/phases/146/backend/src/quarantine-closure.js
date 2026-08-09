const crypto=require("crypto");

function close({
 quarantineId,
 closureState,
 actorId,
 evidence={}
}){
 const allowed=new Set(["RELEASED","REJECTED","RESOLVED"]);

 if(!quarantineId||!actorId||!allowed.has(closureState))
  return {status:"REJECTED"};

 const evidenceHash=crypto
  .createHash("sha256")
  .update(JSON.stringify(evidence))
  .digest("hex");

 return {
  status:"CLOSED",
  quarantineId,
  closureState,
  actorId,
  evidenceHash
 };
}
module.exports={close};
