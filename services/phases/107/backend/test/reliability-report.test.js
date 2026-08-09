const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateReliability
}=require("../src/reliability-report");

test("reliability is calculated",()=>{
  const result=calculateReliability({
    totalChecks:1000,
    successfulChecks:999,
    failedChecks:1,
    burnAlerts:2
  });

  assert.equal(
    result.availabilityPercent,
    99.9
  );
  assert.equal(
    result.burnAlerts,
    2
  );
});
