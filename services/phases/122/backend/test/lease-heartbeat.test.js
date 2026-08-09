const test=require("node:test");
const assert=require("node:assert/strict");
const {renewLease}=require("../src/lease-heartbeat");

test("active lease renews",()=>{
  const r=renewLease({
    status:"CLAIMED",
    runKey:"run-1",
    workerId:"w1",
    leaseToken:"token",
    leaseExpiresAt:"2026-01-01T00:10:00Z",
    now:"2026-01-01T00:05:00Z",
    extensionSeconds:300
  });
  assert.equal(r.status,"RENEWED");
});

test("expired lease cannot renew",()=>{
  const r=renewLease({
    status:"CLAIMED",runKey:"run-1",workerId:"w1",
    leaseToken:"token",
    leaseExpiresAt:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:05:00Z"
  });
  assert.equal(r.status,"EXPIRED");
});
