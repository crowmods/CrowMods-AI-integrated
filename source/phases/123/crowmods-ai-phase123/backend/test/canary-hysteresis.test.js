const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateHysteresis}=require("../src/canary-hysteresis");

test("persistent failure rolls back",()=>{
  const r=evaluateHysteresis({
    healthScore:.2,
    consecutiveFailures:2
  });
  assert.equal(r.action,"ROLLBACK");
});

test("stable recovery is recognized",()=>{
  const r=evaluateHysteresis({
    healthScore:.9,
    consecutiveSuccesses:3
  });
  assert.equal(r.action,"RECOVER");
});
