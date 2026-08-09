const test=require("node:test");
const assert=require("node:assert/strict");
const {sequentialCalibration}=require("../src/sequential-calibration-controller");

test("undercoverage expands",()=>{
  const r=sequentialCalibration({
    coveredCount:60,
    sampleCount:100,
    currentWindow:100
  });
  assert.equal(r.action,"EXPAND");
  assert.equal(r.windowSize,150);
});

test("healthy confidence holds",()=>{
  const r=sequentialCalibration({
    coveredCount:90,
    sampleCount:100,
    currentWindow:100
  });
  assert.equal(r.action,"HOLD");
});
