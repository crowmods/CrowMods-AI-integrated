const test=require("node:test"); const assert=require("node:assert/strict");
const {rollup}=require("../src/percentiles");
test("percentiles are persisted-ready",()=>{const r=rollup([10,20,30,40,50,60,70,80,90,100]); assert.equal(r.sampleCount,10); assert.equal(r.p50Ms,55); assert.equal(r.p95Ms,95.5);});
