const test=require("node:test");
const assert=require("node:assert/strict");
const {buildRowAudit}=require("../src/purge-audit-binding");

test("purge row audit binds record to run",()=>{
 const r=buildRowAudit({
  runId:"r1",
  tableName:"alert_ack_history",
  recordKey:12,
  retentionDays:30,
  action:"PURGED"
 });
 assert.equal(r.status,"READY");
 assert.equal(r.recordKey,"12");
});
