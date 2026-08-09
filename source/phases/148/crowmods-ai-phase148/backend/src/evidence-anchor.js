const crypto=require("crypto");

function hash(value){
 return crypto.createHash("sha256")
  .update(String(value)).digest("hex");
}

function createAnchor({
 quarantineId,
 chainHeadHash,
 previousAnchorHash=null,
 anchorVersion=1,
 anchoredBy
}){
 if(!quarantineId||!chainHeadHash||!anchoredBy)
  return {status:"REJECTED"};

 const anchorHash=hash(
  `${quarantineId}:${chainHeadHash}:`+
  `${previousAnchorHash||""}:${anchorVersion}:${anchoredBy}`
 );

 return {
  status:"ANCHORED",
  quarantineId,
  chainHeadHash,
  previousAnchorHash,
  anchorVersion:Number(anchorVersion),
  anchorHash,
  anchoredBy
 };
}
module.exports={createAnchor,hash};
