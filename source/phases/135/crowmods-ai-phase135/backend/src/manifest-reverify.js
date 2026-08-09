const crypto=require("crypto");

function sha256(value){
 return crypto.createHash("sha256").update(value).digest("hex");
}

function reverify({
 reviewer,
 events=[],
 expectedPayloadHash,
 expectedManifestHash
}){
 const payload=JSON.stringify(events);
 const payloadHash=sha256(payload);
 const manifest=JSON.stringify({
   reviewer,
   payloadHash,
   eventCount:events.length,
   algorithm:"SHA-256"
 });
 const manifestHash=sha256(manifest);

 return {
   result:payloadHash===expectedPayloadHash &&
     manifestHash===expectedManifestHash
     ?"VERIFIED":"MISMATCH",
   payloadHash,
   manifestHash
 };
}

module.exports={reverify};
