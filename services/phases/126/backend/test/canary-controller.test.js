const test=require("node:test");
const assert=require("node:assert/strict");
const {canaryRecoveryController}=require("../src/canary-controller");

test("rollback recovers one stage at a time",()=>{
  const r=canaryRecoveryController({
    state:"ROLLBACK",
    currentStage:1,
    healthScore:.9,
    consecutiveSuccesses:3
  });
  assert.equal(r.state,"RECOVERY");
  assert.equal(r.trafficPercent,5);
});

test("poor health returns to rollback",()=>{
  const r=canaryRecoveryController({
    state:"STABLE",
    currentStage:5,
    healthScore:.2,
    consecutiveSuccesses:0
  });
  assert.equal(r.state,"ROLLBACK");
  assert.equal(r.trafficPercent,0);
});
