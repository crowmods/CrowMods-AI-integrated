const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateAlert}=require("../src/alert-escalation");

test("repeated warning escalates",()=>{
 const r=evaluateAlert({
  severity:"WARNING",
  consecutiveHits:4
 });
 assert.equal(r.action,"ESCALATE");
 assert.equal(r.severity,"CRITICAL");
});

test("normal state resets",()=>{
 const r=evaluateAlert({
  severity:"NORMAL",
  consecutiveHits:5
 });
 assert.equal(r.action,"RESET");
});
