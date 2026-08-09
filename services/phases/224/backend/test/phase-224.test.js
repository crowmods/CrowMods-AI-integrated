const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-224");
test("phase 224 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,224);
});
test("phase 224 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
