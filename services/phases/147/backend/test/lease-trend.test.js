const test=require("node:test");
const assert=require("node:assert/strict");
const {detectTrend}=require("../src/lease-trend");

test("conflict spike is detected",()=>{
 const r=detectTrend({
  observedRate:.30,
  baselineRate:.05,
  spikeMultiplier:3
 });
 assert.equal(r.state,"SPIKE");
});
