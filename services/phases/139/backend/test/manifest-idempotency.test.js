const test=require("node:test");
const assert=require("node:assert/strict");
const {checkIdempotency}=require("../src/manifest-idempotency");

test("repeated key becomes replay",()=>{
 const r=checkIdempotency({
  exportId:"e1",
  result:"VERIFIED",
  payloadHash:"a",
  manifestHash:"b"
 },{
  exportId:"e1"
 });
 assert.equal(r.status,"REPLAY");
});

test("same key for different export conflicts",()=>{
 const r=checkIdempotency({
  exportId:"e1",
  result:"VERIFIED",
  payloadHash:"a",
  manifestHash:"b"
 },{
  exportId:"e2"
 });
 assert.equal(r.status,"CONFLICT");
});
