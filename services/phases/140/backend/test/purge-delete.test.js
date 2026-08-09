const test=require("node:test");
const assert=require("node:assert/strict");
const {buildDeleteRequest}=require("../src/purge-delete");

test("delete request is transactional and locked",()=>{
 const r=buildDeleteRequest({
  tableName:"alert_ack_history",
  retentionDays:30,
  batchSize:50
 });
 assert.equal(r.status,"AUTHORIZED");
 assert.equal(r.transactional,true);
 assert.match(r.lockMode,/SKIP LOCKED/);
});
