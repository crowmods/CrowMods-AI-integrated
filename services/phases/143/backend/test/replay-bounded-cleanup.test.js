const test=require("node:test");
const assert=require("node:assert/strict");
const {buildCleanupBatch}=require("../src/replay-bounded-cleanup");

test("cleanup batch is bounded",()=>{
 const r=buildCleanupBatch({
  entries:Array.from({length:500},(_,i)=>({
   idempotencyKey:String(i),
   expiresAt:"2025-01-01T00:00:00Z"
  })),
  batchSize:300,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.examinedCount,250);
 assert.equal(r.expiredCount,250);
});
