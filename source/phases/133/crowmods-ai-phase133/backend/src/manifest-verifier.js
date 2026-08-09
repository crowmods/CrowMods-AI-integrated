const crypto=require("crypto");
function sha256(value){
  return crypto.createHash("sha256").update(value).digest("hex");
}
function verifyManifest({
  reviewer,
  events=[],
  expectedPayloadHash,
  expectedManifestHash
}){
  const payload=JSON.stringify(events);
  const actualPayloadHash=sha256(payload);
  const manifest=JSON.stringify({
    reviewer,
    payloadHash:actualPayloadHash,
    eventCount:events.length,
    algorithm:"SHA-256"
  });
  const actualManifestHash=sha256(manifest);

  return {
    result:actualPayloadHash===expectedPayloadHash &&
      actualManifestHash===expectedManifestHash
      ?"VERIFIED":"MISMATCH",
    actualPayloadHash,
    actualManifestHash
  };
}
module.exports={sha256,verifyManifest};
