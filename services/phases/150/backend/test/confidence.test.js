const test=require("node:test");
const assert=require("node:assert/strict");
const {calculateConfidence}=require("../src/confidence");

test("confidence interval is bounded",()=>{
 const r=calculateConfidence({
  samples:[.10,.12,.11,.09,.13]
 });
 assert.equal(r.sampleCount,5);
 assert.ok(r.lowerBound>=0);
 assert.ok(r.upperBound<=1);
 assert.ok(r.lowerBound<=r.meanRate);
 assert.ok(r.upperBound>=r.meanRate);
});
