const test=require("node:test"); const assert=require("node:assert/strict"); const {histogram}=require("../src/retry-histogram");
test("histogram buckets latency",()=>{const r=histogram([10,60,120,250,3000]); assert.equal(r.counts["50"],1); assert.equal(r.counts["100"],1); assert.equal(r.counts["250"],2); assert.equal(r.overflow,1);});
