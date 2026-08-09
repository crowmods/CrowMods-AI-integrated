const test=require("node:test");
const assert=require("node:assert/strict");
const {buildRepairItem,claim}=require("../src/repair-queue");

test("repair item is created",()=>{
 const r=buildRepairItem({
  runId:"r1",recordKey:"42",mismatchType:"OUTCOME_MISMATCH"
 });
 assert.equal(r.status,"READY");
});

test("open item can be claimed",()=>{
 const r=claim({
  status:"OPEN",attempts:1
 },"worker-1");
 assert.equal(r.status,"CLAIMED");
 assert.equal(r.attempts,2);
});
