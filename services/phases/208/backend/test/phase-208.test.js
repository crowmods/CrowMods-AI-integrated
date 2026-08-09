const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-208");
test("phase 208 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,208);
});
test("phase 208 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
