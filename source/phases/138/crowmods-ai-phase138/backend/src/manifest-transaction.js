const crypto=require("crypto");

function hash(value){
 return crypto.createHash("sha256").update(value).digest("hex");
}

function verifyTransaction({
 reviewer,
 workerId,
 exportId,
 events=[],
 expectedPayloadHash,
 expectedManifestHash
}){
 const payload=JSON.stringify(events);
 const payloadHash=hash(payload);
 const manifest=JSON.stringify({
  reviewer,
  payloadHash,
  eventCount:events.length,
  algorithm:"SHA-256"
 });
 const manifestHash=hash(manifest);

 return {
  exportId,
  workerId,
  payloadHash,
  manifestHash,
  result:payloadHash===expectedPayloadHash &&
    manifestHash===expectedManifestHash
    ?"VERIFIED":"MISMATCH"
 };
}

module.exports={verifyTransaction};
