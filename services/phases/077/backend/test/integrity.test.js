const test=require("node:test");
const assert=require("node:assert/strict");
const {
  canonicalize,
  digest,
  chainHash,
  verifyDigest,
  verifyChain
}=require("../src/integrity");

test("canonicalization is key-order independent",()=>{
  assert.equal(
    canonicalize({b:2,a:1}),
    canonicalize({a:1,b:2})
  );
});

test("digest verifies unchanged payload",()=>{
  const payload={incidentId:"i1",healthy:true};
  assert.equal(
    verifyDigest(payload,digest(payload)),
    true
  );
});

test("audit chain verifies",()=>{
  const firstPayload={value:1};
  const firstHash=chainHash({
    previousHash:null,
    eventType:"TEST",
    payload:firstPayload,
    actor:"system"
  });

  const secondPayload={value:2};
  const secondHash=chainHash({
    previousHash:firstHash,
    eventType:"TEST",
    payload:secondPayload,
    actor:"system"
  });

  const result=verifyChain([
    {
      sequence_id:1,
      event_type:"TEST",
      event_payload:firstPayload,
      actor:"system",
      event_hash:firstHash
    },
    {
      sequence_id:2,
      event_type:"TEST",
      event_payload:secondPayload,
      actor:"system",
      event_hash:secondHash
    }
  ]);

  assert.equal(result.valid,true);
});
