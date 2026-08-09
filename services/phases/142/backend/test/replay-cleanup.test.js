const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyCleanup}=require("../src/replay-cleanup");

test("cleanup counts expired and conflict entries",()=>{
 const r=classifyCleanup({
  now:"2026-01-01T00:00:00Z",
  entries:[
   {expiresAt:"2025-01-01T00:00:00Z"},
   {expiresAt:"2027-01-01T00:00:00Z",conflict:true},
   {expiresAt:"2027-01-01T00:00:00Z"}
  ]
 });
 assert.equal(r.examinedCount,3);
 assert.equal(r.removedCount,1);
 assert.equal(r.conflictCount,1);
});
