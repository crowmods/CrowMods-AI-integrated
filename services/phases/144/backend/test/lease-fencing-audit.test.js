const test=require("node:test");
const assert=require("node:assert/strict");
const {buildAudit}=require("../src/lease-fencing-audit");

test("lease token is hashed for audit",()=>{
 const r=buildAudit({
  modelKey:"m",
  ownerId:"worker",
  fencingVersion:14,
  leaseToken:"secret-token",
  result:"RENEWED"
 });
 assert.equal(r.status,"READY");
 assert.equal(r.leaseTokenHash.length,64);
});
