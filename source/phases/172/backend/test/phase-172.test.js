const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-172");

test("phase 172 allows an explicitly permitted action",()=>{
 const r=evaluate({
  actorId:"operator",
  action:"read",
  resource:"asset",
  allowed:[{actorId:"operator",action:"read",resource:"asset"}]
 });
 assert.equal(r.state,"ALLOW");
 assert.equal(r.phase,172);
});

test("phase 172 denies missing or unauthorized context",()=>{
 const r=evaluate({actorId:"operator",action:"write",resource:"asset"});
 assert.equal(r.state,"DENY");
});
