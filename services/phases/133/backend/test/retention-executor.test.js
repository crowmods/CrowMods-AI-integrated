const test=require("node:test");
const assert=require("node:assert/strict");
const {buildPurgePlan}=require("../src/retention-executor");
test("purge plan respects batch size",()=>{
 const r=buildPurgePlan({
  now:"2026-01-31T00:00:00Z",
  retentionDays:30,
  batchSize:2,
  records:[
   {key:"a",createdAt:"2025-01-01T00:00:00Z"},
   {key:"b",createdAt:"2025-01-02T00:00:00Z"},
   {key:"c",createdAt:"2025-01-03T00:00:00Z"}
  ]
 });
 assert.equal(r.eligibleCount,2);
});
