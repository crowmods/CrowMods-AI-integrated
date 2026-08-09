const test=require("node:test");
const assert=require("node:assert/strict");
const {createAnchor}=require("../src/evidence-anchor");

test("anchor is deterministic for supplied inputs",()=>{
 const a=createAnchor({
  quarantineId:"q1",
  chainHeadHash:"head",
  anchorVersion:1,
  anchoredBy:"operator"
 });
 const b=createAnchor({
  quarantineId:"q1",
  chainHeadHash:"head",
  anchorVersion:1,
  anchoredBy:"operator"
 });
 assert.equal(a.status,"ANCHORED");
 assert.equal(a.anchorHash,b.anchorHash);
});
