const test=require("node:test");
const assert=require("node:assert/strict");
const {
  acquireRecoveryLease,
  validateRecoveryLease
}=require("../src/lease-recovery-scheduler");

test("recovery worker acquires lease",()=>{
  const r=acquireRecoveryLease({
    currentVersion:4,
    leaseExpiresAt:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:02:00Z",
    workerId:"w2",
    leaseToken:"t2"
  });
  assert.equal(r.status,"ACQUIRED");
  assert.equal(r.fencingVersion,5);
});

test("valid lease passes fencing validation",()=>{
  const r=validateRecoveryLease({
    workerId:"w",
    expectedWorkerId:"w",
    leaseToken:"t",
    expectedLeaseToken:"t",
    fencingVersion:5,
    expectedFencingVersion:5,
    leaseExpiresAt:"2027-01-01T00:10:00Z",
    now:"2027-01-01T00:05:00Z"
  });
  assert.equal(r.status,"VALID");
});
