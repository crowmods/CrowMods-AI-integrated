const test=require("node:test");
const assert=require("node:assert/strict");
const {buildFencedAudit}=require("../src/fenced-audit");

test("fenced write creates audit join",()=>{
 const r=buildFencedAudit({
  modelKey:"m",
  ownerId:"w",
  fencingVersion:8,
  checkpointVersion:9,
  result:"COMMITTED"
 });
 assert.equal(r.status,"READY");
 assert.equal(r.fencingVersion,8);
});
