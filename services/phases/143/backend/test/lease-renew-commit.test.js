const test=require("node:test");
const assert=require("node:assert/strict");
const {commit}=require("../src/lease-renew-commit");

test("lease renewal and checkpoint commit are atomic",async()=>{
 const pool={query:async()=>({
  rows:[{result:"COMMITTED",new_checkpoint_version:"14"}]
 })};

 const r=await commit(pool,{
  modelKey:"m",
  ownerId:"worker",
  leaseToken:"token",
  fencingVersion:13,
  expectedCheckpoint:13,
  newLeaseExpiry:"2027-01-01T01:00:00Z",
  action:"EXPAND",
  windowSize:200
 });

 assert.equal(r.status,"COMMITTED");
 assert.equal(r.newCheckpointVersion,14);
});
