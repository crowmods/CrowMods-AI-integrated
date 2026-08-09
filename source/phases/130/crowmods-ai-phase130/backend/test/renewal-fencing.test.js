const test=require("node:test");
const assert=require("node:assert/strict");
const {renewLease}=require("../src/renewal-fencing");

test("matching lease renews",()=>{
  const r=renewLease({
    workerId:"w",
    expectedWorkerId:"w",
    leaseToken:"t",
    expectedLeaseToken:"t",
    expectedFencingVersion:5,
    currentFencingVersion:5,
    leaseExpiresAt:"2027-01-01T00:10:00Z",
    now:"2027-01-01T00:05:00Z"
  });
  assert.equal(r.status,"RENEWED");
});

test("wrong fencing version conflicts",()=>{
  const r=renewLease({
    workerId:"w",
    expectedWorkerId:"w",
    leaseToken:"t",
    expectedLeaseToken:"t",
    expectedFencingVersion:5,
    currentFencingVersion:6,
    leaseExpiresAt:"2027-01-01T00:10:00Z",
    now:"2027-01-01T00:05:00Z"
  });
  assert.equal(r.status,"CONFLICT");
});
