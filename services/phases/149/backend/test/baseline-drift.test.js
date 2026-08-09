const test=require("node:test");
const assert=require("node:assert/strict");
const {updateWithDriftControl}=require("../src/baseline-drift");

test("baseline movement is capped",()=>{
 const r=updateWithDriftControl({
  baselineRate:.10,
  candidateRate:.50,
  minRate:0,
  maxRate:1,
  maxStep:.05
 });
 assert.equal(r.baselineRate,.15);
 assert.equal(r.appliedStep,.05);
});
