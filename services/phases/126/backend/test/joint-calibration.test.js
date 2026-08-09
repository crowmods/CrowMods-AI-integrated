const test=require("node:test");
const assert=require("node:assert/strict");
const {jointCalibration}=require("../src/joint-calibration");

test("critical drift expands window",()=>{
  const r=jointCalibration({
    currentSize:100,
    driftRatio:2,
    coverageError:.01
  });
  assert.equal(r.status,"EXPAND");
  assert.equal(r.windowSize,150);
});

test("stable calibration shrinks",()=>{
  const r=jointCalibration({
    currentSize:100,
    driftRatio:1,
    coverageError:.01
  });
  assert.equal(r.status,"SHRINK");
});
