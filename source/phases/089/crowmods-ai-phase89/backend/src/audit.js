const crypto=require("crypto");

function canonicalEvent({
  actor,
  action,
  resourceType,
  resourceId=null,
  allowed,
  metadata={},
  previousHash=null
}){
  return JSON.stringify({
    actor,
    action,
    resourceType,
    resourceId,
    allowed:Boolean(allowed),
    metadata,
    previousHash
  });
}

function eventHash(event,previousHash=null){
  return crypto.createHash("sha256")
    .update(canonicalEvent({
      ...event,
      previousHash
    }))
    .digest("hex");
}

function verifyChain(events){
  let previous=null;

  for(const event of events){
    const expected=eventHash({
      actor:event.actor,
      action:event.action,
      resourceType:event.resource_type||event.resourceType,
      resourceId:event.resource_id||event.resourceId||null,
      allowed:event.allowed,
      metadata:event.metadata||{}
    },previous);

    if(event.previous_hash!==previous||
       event.event_hash!==expected){
      return {
        valid:false,
        failedEvent:event.id||event.event_id
      };
    }

    previous=event.event_hash;
  }

  return {
    valid:true,
    count:events.length,
    lastHash:previous
  };
}

module.exports={
  canonicalEvent,
  eventHash,
  verifyChain
};
