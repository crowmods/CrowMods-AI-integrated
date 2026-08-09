const test=require("node:test");
const assert=require("node:assert/strict");
const {validateBinding}=require("../src/lease-checkpoint-binding");

test("lease and checkpoint can be bound",()=>{
 const r=validateBinding({
  modelKey:"m",
  ownerId:"worker",
  expectedOwnerId:"worker",
  fencingVersion:8,
  expectedFencingVersion:8,
  checkpointVersion:9
 });
 assert.equal(r.status,"BOUND");
});
