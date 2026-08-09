const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyReplay}=require("../src/manifest-replay");

test("same export replays",()=>{
 const r=classifyReplay({
  exportId:"e1",
  result:"VERIFIED",
  payloadHash:"a",
  manifestHash:"b"
 },{
  exportId:"e1"
 });
 assert.equal(r.action,"REPLAY");
});

test("different export conflicts",()=>{
 const r=classifyReplay({
  exportId:"e1",
  result:"VERIFIED",
  payloadHash:"a",
  manifestHash:"b"
 },{
  exportId:"e2"
 });
 assert.equal(r.action,"CONFLICT");
});
