const crypto=require("crypto");
function sha256(value){
 return crypto.createHash("sha256").update(value).digest("hex");
}
function buildManifest({reviewer,events}){
 const payload=JSON.stringify(events||[]);
 const payloadHash=sha256(payload);
 const manifest=JSON.stringify({
  reviewer,payloadHash,eventCount:(events||[]).length,algorithm:"SHA-256"
 });
 return {
  reviewer,payloadHash,manifestHash:sha256(manifest),
  algorithm:"SHA-256",eventCount:(events||[]).length
 };
}
module.exports={buildManifest};
