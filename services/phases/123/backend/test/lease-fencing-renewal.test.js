const test=require("node:test");
const assert=require("node:assert/strict");
const {renewFencedLease}=require("../src/lease-fencing-renewal");

test("matching fencing lease renews",()=>{
  const r=renewFencedLease({
    status:"CLAIMED",
    runKey:"r",
    workerId:"w",
    leaseToken:"t",
    presentedFencingVersion:4,
    currentFencingVersion:4,
    leaseExpiresAt:"2027-01-01T00:10:00Z",
    now:"2027-01-01T00:05:00Z"
  });
  assert.equal(r.status,"RENEWED");
});

test("stale fencing lease is rejected",()=>{
  const r=renewFencedLease({
    status:"CLAIMED",
    runKey:"r",
    workerId:"w",
    leaseToken:"t",
    presentedFencingVersion:3,
    currentFencingVersion:4,
    leaseExpiresAt:"2027-01-01T00:10:00Z",
    now:"2027-01-01T00:05:00Z"
  });
  assert.equal(r.reason,"stale_fencing_version");
});
