const test=require("node:test");
const assert=require("node:assert/strict");
const {close}=require("../src/quarantine-closure");

test("closure produces evidence hash",()=>{
 const r=close({
  quarantineId:"q1",
  closureState:"RESOLVED",
  actorId:"operator",
  evidence:{ticket:"INC-42"}
 });
 assert.equal(r.status,"CLOSED");
 assert.equal(r.evidenceHash.length,64);
});
