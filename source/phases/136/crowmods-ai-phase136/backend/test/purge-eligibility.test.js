const test=require("node:test");
const assert=require("node:assert/strict");
const {isEligible}=require("../src/purge-eligibility");

test("expired row is eligible",()=>{
 const r=isEligible({
  createdAt:"2020-01-01T00:00:00Z",
  retentionDays:30,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.eligible,true);
});

test("recent row is retained",()=>{
 const r=isEligible({
  createdAt:"2025-12-20T00:00:00Z",
  retentionDays:30,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.eligible,false);
});
