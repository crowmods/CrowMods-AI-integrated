const test=require("node:test");
const assert=require("node:assert/strict");
const {rollingBaseline}=require("../src/rolling-baseline");

test("rolling baseline retains bounded samples",()=>{
 const r=rollingBaseline({
  previous:[10,20,30],
  incoming:[40,50,60],
  maxSamples:4
 });
 assert.equal(r.sampleCount,4);
 assert.equal(r.p50Ms,45);
});
