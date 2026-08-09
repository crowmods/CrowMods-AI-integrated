const test=require("node:test");
const assert=require("node:assert/strict");
const {acquire,renew}=require("../src/calibration-lease-cas");

test("acquisition returns fencing version",async()=>{
 const pool={query:async()=>({
  rows:[{result:"ACQUIRED",fencing_version:"8"}]
 })};
 const r=await acquire(pool,{
  modelKey:"m",ownerId:"w",leaseToken:"t",
  expectedVersion:7,
  leaseExpiresAt:"2027-01-01T00:10:00Z"
 });
 assert.equal(r.status,"ACQUIRED");
 assert.equal(r.fencingVersion,8);
});

test("renewal preserves fencing version",async()=>{
 const pool={query:async()=>({
  rows:[{result:"RENEWED",fencing_version:"8"}]
 })};
 const r=await renew(pool,{
  modelKey:"m",ownerId:"w",leaseToken:"t",
  expectedVersion:8,
  leaseExpiresAt:"2027-01-01T00:10:00Z"
 });
 assert.equal(r.status,"RENEWED");
 assert.equal(r.fencingVersion,8);
});
