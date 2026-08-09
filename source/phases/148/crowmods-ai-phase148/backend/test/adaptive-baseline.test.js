const test=require("node:test");
const assert=require("node:assert/strict");
const {updateBaseline}=require("../src/adaptive-baseline");

test("baseline adapts toward observed rate",()=>{
 const r=updateBaseline({
  baselineRate:.10,
  observedRate:.20,
  sampleCount:10,
  alpha:.20
 });
 assert.equal(r.sampleCount,11);
 assert.equal(r.baselineRate,.12);
});
