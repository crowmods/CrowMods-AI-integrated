const test=require("node:test");
const assert=require("node:assert/strict");
const {scheduleRecovery}=require("../src/recovery-scheduler");

test("rollback schedules cooldown",()=>{
  const r=scheduleRecovery({
    state:"ROLLBACK",
    now:"2026-01-01T00:00:00Z",
    checkIntervalMs:60000
  });
  assert.equal(r.state,"COOLDOWN");
});

test("expired cooldown enters recovery",()=>{
  const r=scheduleRecovery({
    state:"COOLDOWN",
    stage:1,
    cooldownUntil:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:02:00Z"
  });
  assert.equal(r.state,"RECOVERY");
});
