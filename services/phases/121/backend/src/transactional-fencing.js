const crypto=require("crypto");

function payloadDigest(payload){
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function verifyTransaction({
  resourceKey,
  expectedResourceKey,
  tokenVersion,
  currentTokenVersion,
  tokenActive,
  payload,
  expectedPayloadDigest
}){
  if(resourceKey!==expectedResourceKey)
    return {
      accepted:false,
      reason:"resource_mismatch"
    };

  if(tokenVersion!==currentTokenVersion)
    return {
      accepted:false,
      reason:"stale_token_version"
    };

  if(tokenActive!==true)
    return {
      accepted:false,
      reason:"token_inactive"
    };

  const digest=payloadDigest(payload);

  if(digest!==expectedPayloadDigest)
    return {
      accepted:false,
      reason:"payload_digest_mismatch"
    };

  return {
    accepted:true,
    payloadDigest:digest
  };
}

module.exports={
  payloadDigest,
  verifyTransaction
};
