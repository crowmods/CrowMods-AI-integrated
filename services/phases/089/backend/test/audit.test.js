const test=require("node:test");
const assert=require("node:assert/strict");
const {
  eventHash,
  verifyChain
}=require("../src/audit");

test("audit hash is deterministic",()=>{
  const event={
    actor:"operator",
    action:"view",
    resourceType:"incident",
    resourceId:"1",
    allowed:true,
    metadata:{}
  };

  assert.equal(
    eventHash(event,null),
    eventHash(event,null)
  );
});

test("valid audit chain verifies",()=>{
  const first={
    actor:"operator",
    action:"view",
    resourceType:"incident",
    resourceId:"1",
    allowed:true,
    metadata:{}
  };

  const firstHash=eventHash(first,null);

  const second={
    actor:"operator",
    action:"ack",
    resourceType:"incident",
    resourceId:"1",
    allowed:true,
    metadata:{}
  };

  const secondHash=eventHash(second,firstHash);

  const result=verifyChain([
    {
      id:1,
      actor:first.actor,
      action:first.action,
      resource_type:first.resourceType,
      resource_id:first.resourceId,
      allowed:first.allowed,
      metadata:first.metadata,
      previous_hash:null,
      event_hash:firstHash
    },
    {
      id:2,
      actor:second.actor,
      action:second.action,
      resource_type:second.resourceType,
      resource_id:second.resourceId,
      allowed:second.allowed,
      metadata:second.metadata,
      previous_hash:firstHash,
      event_hash:secondHash
    }
  ]);

  assert.equal(result.valid,true);
});
