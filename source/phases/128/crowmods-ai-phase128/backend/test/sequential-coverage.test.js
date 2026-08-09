const test=require("node:test");
const assert=require("node:assert/strict");
const {updateSequentialCoverage}=require("../src/sequential-coverage");

test("sequential coverage updates",()=>{
  const r=updateSequentialCoverage({
    coveredCount:90,
    sampleCount:100,
    additionalCovered:45,
    additionalSamples:50
  });
  assert.equal(r.sampleCount,150);
  assert.equal(r.coverage,.9);
  assert.equal(r.status,"ON_TARGET");
});
