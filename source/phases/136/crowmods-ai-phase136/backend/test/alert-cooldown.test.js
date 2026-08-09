const test=require("node:test");
const assert=require("node:assert/strict");
const {shouldTrigger}=require("../src/alert-cooldown");

test("active cooldown suppresses duplicate",()=>{
 const r=shouldTrigger({
  alertKey:"retry:p95",
  severity:"WARNING",
  now:"2026-01-01T00:00:00Z",
  cooldownUntil:"2026-01-01T00:05:00Z"
 });
 assert.equal(r.trigger,false);
});

test("expired cooldown permits alert",()=>{
 const r=shouldTrigger({
  alertKey:"retry:p95",
  severity:"WARNING",
  now:"2026-01-01T00:10:00Z",
  cooldownUntil:"2026-01-01T00:05:00Z"
 });
 assert.equal(r.trigger,true);
});
