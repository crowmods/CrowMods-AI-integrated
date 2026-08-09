const test=require("node:test");
const assert=require("node:assert/strict");
const {commit}=require("../src/fenced-calibration");

test("lease-fenced calibration commit succeeds",async()=>{
 const pool={query:async()=>({
  rows:[{result:"COMMITTED",new_checkpoint_version:"13"}]
 })};

 const r=await commit(pool,{
  modelKey:"m",
  ownerId:"worker",
  fencingVersion:12,
  expectedCheckpoint:12,
  action:"EXPAND",
  windowSize:200
 });

 assert.equal(r.status,"COMMITTED");
 assert.equal(r.newCheckpointVersion,13);
});
