const test=require("node:test");
const assert=require("node:assert/strict");
const {buildExecutionPlan}=require("../src/retention-executor");

test("retention admin can purge allowlisted table",()=>{
 const r=buildExecutionPlan({
  role:"retention_admin",
  action:"PURGE",
  table:"alert_ack_history"
 });
 assert.equal(r.status,"AUTHORIZED");
 assert.equal(r.handler.keyColumn,"id");
});

test("unknown table is denied",()=>{
 const r=buildExecutionPlan({
  role:"retention_admin",
  action:"PURGE",
  table:"users"
 });
 assert.equal(r.status,"DENIED");
});
