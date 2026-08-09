const test=require("node:test");
const assert=require("node:assert/strict");
const {
  cooldownAllowed,
  validateCapacity,
  costScore,
  scalingDecision
}=require("../src/controller");

test("cooldown blocks recent action",()=>{
  const result=cooldownAllowed({
    lastActionAt:"2026-01-01T00:00:00Z",
    now:Date.parse("2026-01-01T00:01:00Z"),
    cooldownSeconds:300
  });

  assert.equal(result,false);
});

test("capacity bounds are enforced",()=>{
  assert.equal(
    validateCapacity({
      requestedWorkers:25,
      minWorkers:1,
      maxWorkers:20
    }).valid,
    false
  );
});

test("cost score detects budget overrun",()=>{
  const result=costScore({
    workers:10,
    unitCost:2,
    budget:15
  });

  assert.equal(result.withinBudget,false);
});

test("valid scale-out is selected",()=>{
  const result=scalingDecision({
    currentWorkers:2,
    desiredWorkers:4,
    minWorkers:1,
    maxWorkers:10,
    cooldownSeconds:0
  });

  assert.equal(result.action,"SCALE_OUT");
});
