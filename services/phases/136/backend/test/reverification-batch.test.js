const test=require("node:test");
const assert=require("node:assert/strict");
const {buildBatch}=require("../src/reverification-batch");

test("batch size is bounded",()=>{
 const r=buildBatch({
  exports:Array.from({length:10},(_,i)=>({exportId:String(i)})),
  batchSize:3
 });
 assert.equal(r.examinedCount,3);
});
