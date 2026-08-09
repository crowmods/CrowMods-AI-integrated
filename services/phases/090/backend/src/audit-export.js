const crypto=require("crypto");

function canonicalExport(events){
  return JSON.stringify(
    events.map(event=>({
      id:event.id,
      eventId:event.event_id,
      actor:event.actor,
      action:event.action,
      resourceType:event.resource_type,
      resourceId:event.resource_id,
      allowed:event.allowed,
      metadata:event.metadata,
      previousHash:event.previous_hash,
      eventHash:event.event_hash,
      createdAt:event.created_at
    }))
  );
}

function digestExport(events){
  return crypto.createHash("sha256")
    .update(canonicalExport(events))
    .digest("hex");
}

function signDigest(digest,secret){
  return crypto.createHmac("sha256",String(secret))
    .update(digest)
    .digest("hex");
}

function verifySignature(digest,signature,secret){
  const expected=signDigest(
    digest,
    secret
  );

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(String(signature))
  );
}

module.exports={
  canonicalExport,
  digestExport,
  signDigest,
  verifySignature
};
