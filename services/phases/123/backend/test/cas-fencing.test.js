const test=require("node:test");
const assert=require("node:assert/strict");
const {compareAndSwapFence}=require("../src/cas-fencing");

test("CAS fencing commits matching version",()=>{
  const r=compareAndSwapFence({
    resourceKey:"r",
    expectedResourceKey:"r",
    storedVersion:5,
    expectedVersion:5,
    nextVersion:6,
    payloadDigest:"d",
    expectedPayloadDigest:"d"
  });
  assert.equal(r.status,"COMMITTED");
});

test("CAS fencing rejects concurrent update",()=>{
  const r=compareAndSwapFence({
    resourceKey:"r",
    expectedResourceKey:"r",
    storedVersion:6,
    expectedVersion:5,
    nextVersion:6,
    payloadDigest:"d",
    expectedPayloadDigest:"d"
  });
  assert.equal(r.reason,"compare_and_swap_conflict");
});
