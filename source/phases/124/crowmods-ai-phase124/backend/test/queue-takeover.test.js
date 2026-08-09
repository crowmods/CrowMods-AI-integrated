const test=require("node:test");
const assert=require("node:assert/strict");
const {validateTakeover}=require("../src/queue-takeover");

test("expired lease allows takeover",()=>{
  const r=validateTakeover({
    leaseExpiresAt:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:05:00Z",
    expectedFencingVersion:7,
    currentFencingVersion:7
  });
  assert.equal(r.status,"TAKEOVER_ALLOWED");
  assert.equal(r.nextFencingVersion,8);
});

test("active lease blocks takeover",()=>{
  const r=validateTakeover({
    leaseExpiresAt:"2026-01-01T00:10:00Z",
    now:"2026-01-01T00:05:00Z",
    expectedFencingVersion:7,
    currentFencingVersion:7
  });
  assert.equal(r.reason,"lease_still_active");
});
