const test=require("node:test");
const assert=require("node:assert/strict");
const {transactionalTakeover}=require("../src/transactional-takeover");

test("expired job can be taken over",()=>{
  const r=transactionalTakeover({
    jobStatus:"CLAIMED",
    leaseExpiresAt:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:05:00Z",
    storedFencingVersion:8,
    expectedFencingVersion:8,
    newWorkerId:"w2",
    newLeaseToken:"t2",
    nextLeaseExpiresAt:"2026-01-01T00:10:00Z"
  });
  assert.equal(r.status,"TAKEN_OVER");
  assert.equal(r.newFencingVersion,9);
});

test("version conflict is rejected",()=>{
  const r=transactionalTakeover({
    jobStatus:"CLAIMED",
    leaseExpiresAt:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:05:00Z",
    storedFencingVersion:9,
    expectedFencingVersion:8,
    newWorkerId:"w2",
    newLeaseToken:"t2",
    nextLeaseExpiresAt:"2026-01-01T00:10:00Z"
  });
  assert.equal(r.status,"CONFLICT");
});
