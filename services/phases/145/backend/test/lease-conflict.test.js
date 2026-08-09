const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyConflict}=require("../src/lease-conflict");

test("fencing conflicts are classified",()=>{
 const r=classifyConflict({
  modelKey:"m",
  ownerId:"w",
  fencingVersion:7,
  conflictType:"FENCING_MISMATCH"
 });
 assert.equal(r.status,"RECORDED");
});
