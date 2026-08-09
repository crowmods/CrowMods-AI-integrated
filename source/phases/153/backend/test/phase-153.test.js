const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-153");

test("phase 153 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,153);
 assert.equal(r.feature,'Canary Policy Rollouts');
});

test("phase 153 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
