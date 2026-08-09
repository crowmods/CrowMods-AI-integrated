const test=require("node:test");
const assert=require("node:assert/strict");
const {validateBatch}=require("../src/purge-transaction");

test("allowlisted purge is authorized",()=>{
 const r=validateBatch({
  tableName:"alert_ack_history",
  retentionDays:30,
  batchSize:100
 });
 assert.equal(r.status,"AUTHORIZED");
 assert.equal(r.batchSize,100);
});

test("unknown table denied",()=>{
 const r=validateBatch({
  tableName:"users",
  retentionDays:30,
  batchSize:100
 });
 assert.equal(r.status,"DENIED");
});
