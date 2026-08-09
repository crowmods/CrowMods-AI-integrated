const test=require("node:test");
const assert=require("node:assert/strict");
const {recoverCalibration}=require("../src/calibration-recovery");
test("calibration state recovers",()=>{
 const r=recoverCalibration({
  persistedAction:"EXPAND",
  persistedWindow:150,
  persistedStableCycles:2,
  checkpointVersion:4,
  requestedVersion:4
 });
 assert.equal(r.status,"RECOVERED");
 assert.equal(r.windowSize,150);
});
test("stale checkpoint rejected",()=>{
 const r=recoverCalibration({
  checkpointVersion:5,
  requestedVersion:4
 });
 assert.equal(r.status,"REJECTED");
});
