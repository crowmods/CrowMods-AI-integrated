const test=require("node:test");
const assert=require("node:assert/strict");
const {validateLease}=require("../src/calibration-lease");

test("valid checkpoint lease passes",()=>{
 const r=validateLease({
  ownerId:"worker",
  expectedOwnerId:"worker",
  leaseToken:"token",
  expectedLeaseToken:"token",
  fencingVersion:7,
  expectedFencingVersion:7,
  leaseExpiresAt:"2027-01-01T00:10:00Z",
  now:"2027-01-01T00:05:00Z"
 });
 assert.equal(r.status,"VALID");
});
