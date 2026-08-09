const test=require("node:test");
const assert=require("node:assert/strict");
const {bind}=require("../src/calibration-binding-cas");

test("binding CAS returns bound version",async()=>{
 const pool={query:async()=>({
  rows:[{result:"BOUND",fencing_version:"10"}]
 })};
 const r=await bind(pool,{
  modelKey:"m",
  ownerId:"w",
  fencingVersion:10,
  expectedFencingVersion:9,
  checkpointVersion:11
 });
 assert.equal(r.status,"BOUND");
 assert.equal(r.fencingVersion,10);
});
