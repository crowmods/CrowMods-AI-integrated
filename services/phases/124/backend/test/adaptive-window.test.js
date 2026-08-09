const test=require("node:test");
const assert=require("node:assert/strict");
const {adjustWindow}=require("../src/adaptive-window");

test("poor coverage expands window",()=>{
  const r=adjustWindow({
    currentSize:100,
    coverageError:.2
  });
  assert.equal(r.status,"EXPAND");
  assert.equal(r.windowSize,125);
});

test("tight calibration can shrink",()=>{
  const r=adjustWindow({
    currentSize:100,
    coverageError:.01
  });
  assert.equal(r.status,"SHRINK");
});
