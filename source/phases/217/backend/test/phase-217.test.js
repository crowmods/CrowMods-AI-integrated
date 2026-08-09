const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-217");
test("phase 217 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,217);
});
test("phase 217 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
