const test=require("node:test");
const assert=require("node:assert/strict");
const {authorizePurge,buildPurgeAudit}=require("../src/transactional-purge");

test("authorized purge handler is selected",()=>{
 const r=authorizePurge({
  role:"retention_admin",
  table:"alert_ack_history"
 });
 assert.equal(r.status,"AUTHORIZED");
});

test("row audit is validated",()=>{
 const r=buildPurgeAudit({
  runId:"run",
  table:"alert_ack_history",
  recordKey:"123",
  action:"PURGED",
  actor:"admin"
 });
 assert.equal(r.status,"READY");
});
