const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-299");

test("phase 299 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",score:120});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,299);
 assert.equal(r.score,100);
});

test("phase 299 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
