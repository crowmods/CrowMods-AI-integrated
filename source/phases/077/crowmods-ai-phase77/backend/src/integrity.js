const crypto=require("crypto");

function canonicalize(value){
  if(value===null||typeof value!=="object")
    return JSON.stringify(value);

  if(Array.isArray(value))
    return `[${value.map(canonicalize).join(",")}]`;

  return `{${Object.keys(value).sort().map(key=>
    `${JSON.stringify(key)}:${canonicalize(value[key])}`
  ).join(",")}}`;
}

function digest(payload){
  return crypto
    .createHash("sha256")
    .update(canonicalize(payload),"utf8")
    .digest("hex");
}

function chainHash({
  previousHash=null,
  eventType,
  payload,
  actor
}){
  return digest({
    previousHash,
    eventType,
    payload,
    actor
  });
}

function verifyDigest(payload,expectedDigest){
  return digest(payload)===expectedDigest;
}

function verifyChain(records){
  let previous=null;

  for(const record of records){
    const expected=chainHash({
      previousHash:previous,
      eventType:record.event_type,
      payload:record.event_payload,
      actor:record.actor
    });

    if(expected!==record.event_hash)
      return {
        valid:false,
        failedSequence:record.sequence_id
      };

    previous=record.event_hash;
  }

  return {valid:true};
}

module.exports={
  canonicalize,
  digest,
  chainHash,
  verifyDigest,
  verifyChain
};
