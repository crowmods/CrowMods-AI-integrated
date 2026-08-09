const test=require("node:test");
const assert=require("node:assert/strict");
const {buildOutcome}=require("../src/purge-outcome");

test("purge outcome binds row to run",()=>{
 const r=buildOutcome({
  runId:"r1",
  recordKey:"42",
  tableName:"alert_ack_history",
  outcome:"PURGED",
  auditId:"a1"
 });
 assert.equal(r.status,"READY");
 assert.equal(r.recordKey,"42");
});
