const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-230");
test("phase 230 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,230);
});
test("phase 230 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
