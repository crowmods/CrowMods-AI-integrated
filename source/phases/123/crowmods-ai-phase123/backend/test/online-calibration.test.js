const test=require("node:test");
const assert=require("node:assert/strict");
const {updateOnlineCalibration}=require("../src/online-calibration");

test("online calibration updates radius",()=>{
  const r=updateOnlineCalibration({
    residualWindow:[1,2,3,4,5],
    coverageTarget:.8
  });
  assert.equal(r.status,"UPDATED");
  assert.equal(r.intervalRadius,4);
});
