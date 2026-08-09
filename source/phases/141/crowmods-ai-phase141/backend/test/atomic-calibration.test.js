const test=require("node:test");
const assert=require("node:assert/strict");
const {commit}=require("../src/atomic-calibration");

test("atomic calibration commit returns new version",async()=>{
 const pool={query:async()=>({
  rows:[{result:"COMMITTED",new_checkpoint_version:"12"}]
 })};
 const r=await commit(pool,{
  modelKey:"m",
  ownerId:"w",
  fencingVersion:11,
  expectedCheckpoint:11,
  action:"EXPAND",
  windowSize:150
 });
 assert.equal(r.status,"COMMITTED");
 assert.equal(r.newCheckpointVersion,12);
});
