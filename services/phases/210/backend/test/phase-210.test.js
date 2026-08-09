const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-210");
test("phase 210 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,210);
});
test("phase 210 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
