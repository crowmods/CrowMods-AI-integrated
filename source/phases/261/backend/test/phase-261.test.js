const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-261");

test("phase 261 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",score:120});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,261);
 assert.equal(r.score,100);
});

test("phase 261 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
