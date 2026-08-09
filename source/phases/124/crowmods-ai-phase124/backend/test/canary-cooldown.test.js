const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateRecovery}=require("../src/canary-cooldown");

test("unhealthy rollout enters cooldown",()=>{
  const r=evaluateRecovery({
    healthScore:.4,
    consecutiveSuccesses:0,
    now:"2026-01-01T00:00:00Z"
  });
  assert.equal(r.action,"COOLDOWN");
});

test("stable successes exit recovery",()=>{
  const r=evaluateRecovery({
    healthScore:.9,
    consecutiveSuccesses:3,
    now:"2026-01-01T00:00:00Z"
  });
  assert.equal(r.action,"STABLE");
});
