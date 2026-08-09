const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateCap}=require("../src/alert-cap-reset");

test("expired cap window resets",()=>{
 const r=evaluateCap({
  escalationCount:3,
  cap:3,
  resetAt:"2025-01-01T00:00:00Z",
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.action,"RESET");
 assert.equal(r.escalationCount,0);
});

test("active cap blocks further escalation",()=>{
 const r=evaluateCap({
  escalationCount:3,
  cap:3,
  resetAt:"2027-01-01T00:00:00Z",
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.action,"CAP");
});
