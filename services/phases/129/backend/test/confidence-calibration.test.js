const test=require("node:test");
const assert=require("node:assert/strict");
const {chooseCalibrationAction}=require("../src/confidence-calibration");

test("low confidence coverage expands window",()=>{
  const r=chooseCalibrationAction({
    sampleCount:100,
    coverage:.7,
    lowerBound:.62,
    upperBound:.78,
    currentWindow:100
  });
  assert.equal(r.action,"EXPAND");
  assert.equal(r.windowSize,150);
});

test("in-target confidence holds",()=>{
  const r=chooseCalibrationAction({
    sampleCount:100,
    coverage:.9,
    lowerBound:.87,
    upperBound:.93,
    currentWindow:100
  });
  assert.equal(r.action,"HOLD");
});
