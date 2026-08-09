const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluatePolicy}=require("../src/alert-recovery-policy");

test("critical recovery becomes warning with cooldown",()=>{
 const r=evaluatePolicy({
  severity:"CRITICAL",
  consecutiveHealthy:3,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.action,"RECOVER");
 assert.equal(r.severity,"WARNING");
 assert.ok(r.recoveryCooldownUntil);
});

test("active recovery cooldown holds state",()=>{
 const r=evaluatePolicy({
  severity:"CRITICAL",
  consecutiveHealthy:10,
  recoveryCooldownUntil:"2026-01-01T00:05:00Z",
  now:"2026-01-01T00:02:00Z"
 });
 assert.equal(r.action,"HOLD");
});
