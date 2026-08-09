const test=require("node:test");
const assert=require("node:assert/strict");
const {writeCheckpoint}=require("../src/fenced-checkpoint");

test("fenced checkpoint write commits",async()=>{
 const pool={query:async()=>({
  rows:[{result:"COMMITTED",checkpoint_version:"9"}]
 })};
 const r=await writeCheckpoint(pool,{
  modelKey:"m",
  ownerId:"worker",
  fencingVersion:8,
  expectedCheckpoint:8,
  action:"EXPAND",
  windowSize:150
 });
 assert.equal(r.status,"COMMITTED");
 assert.equal(r.checkpointVersion,9);
});
