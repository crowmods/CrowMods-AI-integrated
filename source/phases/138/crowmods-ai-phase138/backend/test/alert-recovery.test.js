const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateRecovery}=require("../src/alert-recovery");

test("critical alert recovers after healthy cycles",()=>{
 const r=evaluateRecovery({
  severity:"CRITICAL",
  consecutiveHealthy:3
 });
 assert.equal(r.action,"RECOVER");
 assert.equal(r.severity,"WARNING");
});

test("warning resets after recovery",()=>{
 const r=evaluateRecovery({
  severity:"WARNING",
  consecutiveHealthy:3
 });
 assert.equal(r.action,"RESET");
});
