const crypto=require("crypto");

function hash(value){
 return crypto.createHash("sha256")
  .update(String(value)).digest("hex");
}

function appendEvidence({
 quarantineId,
 previousHash=null,
 evidence={},
 actorId
}){
 if(!quarantineId||!actorId)
  return {status:"REJECTED"};

 const evidenceHash=hash(JSON.stringify(evidence));
 const chainHash=hash(
  `${previousHash||""}:${evidenceHash}:${actorId}`
 );

 return {
  status:"APPENDED",
  quarantineId,
  previousHash,
  evidenceHash,
  chainHash,
  actorId
 };
}

function verifyChain(entries=[]){
 let previous=null;

 for(const e of entries){
  const expected=hash(
   `${previous||""}:${e.evidenceHash}:${e.actorId}`
  );

  if(expected!==e.chainHash)
   return {valid:false,failedId:e.id||null};

  previous=e.chainHash;
 }

 return {valid:true,length:entries.length};
}
module.exports={appendEvidence,verifyChain};
