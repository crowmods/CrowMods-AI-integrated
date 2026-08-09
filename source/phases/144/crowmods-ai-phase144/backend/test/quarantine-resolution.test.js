const test=require("node:test");
const assert=require("node:assert/strict");
const {resolve}=require("../src/quarantine-resolution");

test("quarantine can be resolved",()=>{
 const r=resolve({
  quarantineId:"q1",
  operatorId:"operator",
  decision:"REPROCESS",
  reason:"validated export identity"
 });
 assert.equal(r.status,"RESOLVED");
 assert.equal(r.decision,"REPROCESS");
});
