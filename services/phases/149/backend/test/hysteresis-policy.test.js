const test=require("node:test");
const assert=require("node:assert/strict");
const {validatePolicy}=require("../src/hysteresis-policy");

test("policy version is accepted",()=>{
 const r=validatePolicy({
  version:3,
  breachThreshold:2,
  recoveryThreshold:3
 });
 assert.equal(r.status,"VALID");
 assert.equal(r.version,3);
});
