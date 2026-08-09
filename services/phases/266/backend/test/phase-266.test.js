const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-266");

test("phase 266 accepts controlled context",()=>{
 const r=evaluate({actorId:"operator",score:120});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,266);
 assert.equal(r.score,100);
});

test("phase 266 fails closed without actor",()=>{
 assert.equal(evaluate({}).state,"REJECTED");
});
