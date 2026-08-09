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

function createPayloadDigest(payload){
  return crypto
    .createHash("sha256")
    .update(canonicalize(payload))
    .digest("hex");
}

function createEnvelope({
  resourceKey,
  tokenVersion,
  payload,
  expiresAt,
  signer
}){
  if(!resourceKey||
     !Number.isInteger(tokenVersion)||
     !payload||
     !expiresAt||
     !signer)
    return {
      status:"BLOCKED",
      reason:"fencing_envelope_inputs_missing"
    };

  const payloadDigest=createPayloadDigest(payload);

  const envelope={
    resourceKey,
    tokenVersion,
    payloadDigest,
    expiresAt
  };

  const envelopeDigest=crypto
    .createHash("sha256")
    .update(canonicalize(envelope))
    .digest("hex");

  return {
    status:"CREATED",
    ...envelope,
    envelopeDigest,
    signature:signer.sign(envelopeDigest),
    algorithm:signer.algorithm,
    keyVersion:signer.keyVersion
  };
}

function verifyEnvelope({
  envelope,
  payload,
  expectedResourceKey,
  expectedTokenVersion,
  verifier,
  now=new Date()
}){
  if(!envelope||!payload||
     envelope.resourceKey!==expectedResourceKey)
    return {
      valid:false,
      reason:"resource_mismatch"
    };

  if(envelope.tokenVersion!==expectedTokenVersion)
    return {
      valid:false,
      reason:"stale_fencing_version"
    };

  const expiry=new Date(envelope.expiresAt);
  if(Number.isNaN(expiry.getTime())||
     expiry<=new Date(now))
    return {
      valid:false,
      reason:"envelope_expired"
    };

  const payloadDigest=createPayloadDigest(payload);
  if(payloadDigest!==envelope.payloadDigest)
    return {
      valid:false,
      reason:"payload_digest_mismatch"
    };

  const unsigned={
    resourceKey:envelope.resourceKey,
    tokenVersion:envelope.tokenVersion,
    payloadDigest:envelope.payloadDigest,
    expiresAt:envelope.expiresAt
  };

  const envelopeDigest=crypto
    .createHash("sha256")
    .update(canonicalize(unsigned))
    .digest("hex");

  if(envelopeDigest!==envelope.envelopeDigest)
    return {
      valid:false,
      reason:"envelope_digest_mismatch"
    };

  if(!verifier.verify(
    envelope.envelopeDigest,
    envelope.signature
  ))
    return {
      valid:false,
      reason:"signature_invalid"
    };

  return {
    valid:true
  };
}

module.exports={
  canonicalize,
  createPayloadDigest,
  createEnvelope,
  verifyEnvelope
};
