const test=require("node:test");
const assert=require("node:assert/strict");
const {scheduleBackoff}=require("../src/repair-backoff");

test("backoff doubles within bounds",()=>{
 const r=scheduleBackoff({
  attempt:3,
  maxAttempts:5,
  baseDelayMs:1000,
  maxDelayMs:10000,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.state,"SCHEDULED");
 assert.equal(r.delayMs,4000);
});

test("attempt beyond max enters dead letter",()=>{
 const r=scheduleBackoff({attempt:4,maxAttempts:3});
 assert.equal(r.state,"DEAD_LETTER");
});
