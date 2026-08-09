const test=require("node:test");
const assert=require("node:assert/strict");
const {calibrateConformal,detectDrift}=require("../src/conformal-calibration");

test("conformal calibration creates residual band",()=>{
  const r=calibrateConformal({
    residuals:[1,2,3,4,5],
    coverageTarget:.8
  });
  assert.equal(r.status,"CALIBRATED");
  assert.equal(r.nonconformityQuantile,4);
});

test("drift is detected",()=>{
  const r=detectDrift({
    baselineErrors:[1,1,1,1],
    recentErrors:[2,2,2,2]
  });
  assert.equal(r.status,"DRIFT");
});
