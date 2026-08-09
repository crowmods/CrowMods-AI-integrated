const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-204");
test("phase 204 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,204);
});
test("phase 204 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
