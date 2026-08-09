const test=require("node:test");
const assert=require("node:assert/strict");
const {calculateBurnRate}=require("../src/burn-rate");

test("high error burn breaches threshold",()=>{
 const r=calculateBurnRate({
  complianceRatio:.90,
  targetRatio:.99,
  threshold:2
 });
 assert.equal(r.state,"BREACH");
});

test("healthy compliance is normal",()=>{
 const r=calculateBurnRate({
  complianceRatio:.999,
  targetRatio:.99,
  threshold:2
 });
 assert.equal(r.state,"NORMAL");
});
