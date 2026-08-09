const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-282");

test("phase 282 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",score:120});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,282);
 assert.equal(r.score,100);
});

test("phase 282 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
