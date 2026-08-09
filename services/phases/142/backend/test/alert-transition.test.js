const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateRecovery}=require("../src/alert-transition");

test("cooldown suppresses recovery",()=>{
 const r=evaluateRecovery({
  state:"CRITICAL",
  healthyCycles:10,
  cooldownUntil:"2027-01-01T00:05:00Z",
  now:"2027-01-01T00:02:00Z"
 });
 assert.equal(r.action,"HOLD");
 assert.equal(r.reason,"cooldown_active");
});

test("healthy critical state recovers",()=>{
 const r=evaluateRecovery({
  state:"CRITICAL",
  healthyCycles:3,
  now:"2027-01-01T00:00:00Z"
 });
 assert.equal(r.action,"RECOVER");
 assert.equal(r.state,"WARNING");
});
