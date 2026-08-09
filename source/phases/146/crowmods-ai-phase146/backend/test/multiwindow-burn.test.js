const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateWindows,overallState}=require("../src/multiwindow-burn");

test("multi-window policy breaches if any window breaches",()=>{
 const r=evaluateWindows([
  {windowMinutes:5,complianceRatio:.98},
  {windowMinutes:60,complianceRatio:.999}
 ],{targetRatio:.99,threshold:2});
 assert.equal(overallState(r),"BREACH");
});
