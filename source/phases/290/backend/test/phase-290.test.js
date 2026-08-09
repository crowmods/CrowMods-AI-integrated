const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-290");

test("phase 290 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",score:120});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,290);
 assert.equal(r.score,100);
});

test("phase 290 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
