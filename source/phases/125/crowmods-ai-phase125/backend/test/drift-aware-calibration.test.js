const test=require("node:test");
const assert=require("node:assert/strict");
const {selectWindow}=require("../src/drift-aware-calibration");

test("critical drift expands aggressively",()=>{
  const r=selectWindow({
    currentSize:100,
    driftRatio:2
  });
  assert.equal(r.status,"EXPAND_AGGRESSIVELY");
  assert.equal(r.windowSize,150);
});

test("stable calibration shrinks",()=>{
  const r=selectWindow({
    currentSize:100,
    driftRatio:1,
    coverageError:.01
  });
  assert.equal(r.status,"SHRINK");
});
