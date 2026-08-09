const crypto=require("crypto");

function normalize(input={}){
  return {
    phase:169,
    feature:'Cryptographic Audit Events',
    algorithm:String(input.algorithm||""),
    keyId:String(input.keyId||""),
    actorId:String(input.actorId||""),
    evidenceHash:String(input.evidenceHash||"")
  };
}

function evaluate(input={}){
  const x=normalize(input);
  if(!x.actorId && input.requiresActor!==false)
    return {state:"REJECTED",reason:"actor_required",phase:169};
  if(!x.evidenceHash && input.requiresEvidence!==false)
    return {state:"REJECTED",reason:"evidence_required",phase:169};
  return {state:"READY",...x};
}

function digest(value){
  return crypto.createHash("sha256")
    .update(String(value)).digest("hex");
}

module.exports={evaluate,digest};
