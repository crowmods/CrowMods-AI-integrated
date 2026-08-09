const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-231");
test("phase 231 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,231);
});
test("phase 231 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
