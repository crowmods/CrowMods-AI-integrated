const test=require("node:test");
const assert=require("node:assert/strict");
const {buildLockPolicy}=require("../src/purge-locks");

test("purge policy enables row locking",()=>{
 const r=buildLockPolicy({
  tableName:"alert_ack_history",
  retentionDays:30,
  batchSize:100
 });
 assert.equal(r.status,"AUTHORIZED");
 assert.match(r.lockMode,/SKIP LOCKED/);
});
