const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-286");

test("phase 286 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",score:120});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,286);
 assert.equal(r.score,100);
});

test("phase 286 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
