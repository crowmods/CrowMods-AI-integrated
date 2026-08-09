const test=require("node:test");
const assert=require("node:assert/strict");
const {updateHysteresis}=require("../src/burn-hysteresis");

test("breach requires consecutive cycles",()=>{
 const a=updateHysteresis({
  currentSeverity:"NORMAL",
  candidateSeverity:"HIGH",
  breachCycles:0,
  recoveryCycles:0,
  breachThreshold:2
 });
 assert.equal(a.severity,"NORMAL");

 const b=updateHysteresis({
  currentSeverity:a.severity,
  candidateSeverity:"HIGH",
  breachCycles:a.breachCycles,
  recoveryCycles:0,
  breachThreshold:2
 });
 assert.equal(b.severity,"HIGH");
});
