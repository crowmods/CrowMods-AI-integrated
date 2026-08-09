const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-212");
test("phase 212 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",action:"evaluate"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,212);
});
test("phase 212 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
