const test=require("node:test");
const assert=require("node:assert/strict");
const {verifyWithAdapter}=require("../src/evidence-adapter");

test("adapter can verify evidence",()=>{
 const r=verifyWithAdapter({
  adapterKey:"test",
  evidenceHash:"abc",
  adapter:(hash)=>hash==="abc"
 });
 assert.equal(r.state,"VERIFIED");
});
