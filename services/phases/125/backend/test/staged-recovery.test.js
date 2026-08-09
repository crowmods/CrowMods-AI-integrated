const test=require("node:test");
const assert=require("node:assert/strict");
const {stagedRecovery}=require("../src/staged-recovery");

test("recovery advances one stage",()=>{
  const r=stagedRecovery({
    currentStage:2,
    consecutiveSuccesses:3,
    healthScore:.9
  });
  assert.equal(r.stage,3);
  assert.equal(r.trafficPercent,10);
});

test("bad health rolls back",()=>{
  const r=stagedRecovery({
    currentStage:4,
    consecutiveSuccesses:4,
    healthScore:.2
  });
  assert.equal(r.state,"ROLLING_BACK");
  assert.equal(r.trafficPercent,0);
});
