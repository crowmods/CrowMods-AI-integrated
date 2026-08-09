const test=require("node:test");
const assert=require("node:assert/strict");
const {breakerWorkerDecision}=require("../src/breaker-worker");

test("expired breaker cooldown triggers probe",()=>{
  const r=breakerWorkerDecision({
    state:"OPEN",
    cooldownUntil:"2026-01-01T00:01:00Z",
    now:"2026-01-01T00:02:00Z"
  });
  assert.equal(r.action,"PROBE");
  assert.equal(r.nextState,"HALF_OPEN");
});

test("active cooldown waits",()=>{
  const r=breakerWorkerDecision({
    state:"OPEN",
    cooldownUntil:"2026-01-01T00:10:00Z",
    now:"2026-01-01T00:02:00Z"
  });
  assert.equal(r.action,"WAIT");
});
