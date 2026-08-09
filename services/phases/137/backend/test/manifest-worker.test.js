const test=require("node:test");
const assert=require("node:assert/strict");
const {buildWorkerBatch}=require("../src/manifest-worker");

test("worker batch is bounded",()=>{
 const r=buildWorkerBatch({
  exports:Array.from({length:500},(_,i)=>({exportId:String(i)})),
  batchSize:300
 });
 assert.equal(r.batchSize,250);
 assert.equal(r.examinedCount,250);
});
