const test=require("node:test");
const assert=require("node:assert/strict");
const {
  payloadDigest,
  verifyTransaction
}=require("../src/transactional-fencing");

test("matching fencing transaction is accepted",()=>{
  const payload={action:"execute"};
  const result=verifyTransaction({
    resourceKey:"job-1",
    expectedResourceKey:"job-1",
    tokenVersion:3,
    currentTokenVersion:3,
    tokenActive:true,
    payload,
    expectedPayloadDigest:
      payloadDigest(payload)
  });

  assert.equal(result.accepted,true);
});

test("stale fencing transaction is blocked",()=>{
  const payload={action:"execute"};
  const result=verifyTransaction({
    resourceKey:"job-1",
    expectedResourceKey:"job-1",
    tokenVersion:2,
    currentTokenVersion:3,
    tokenActive:true,
    payload,
    expectedPayloadDigest:
      payloadDigest(payload)
  });

  assert.equal(result.reason,"stale_token_version");
});
