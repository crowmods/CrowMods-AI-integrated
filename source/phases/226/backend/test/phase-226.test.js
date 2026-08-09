const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-226");
test("phase 226 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,226);
});
test("phase 226 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
