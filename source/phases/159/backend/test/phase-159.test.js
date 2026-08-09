const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-159");

test("phase 159 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,159);
 assert.equal(r.feature,'Replay Quarantine Escalation');
});

test("phase 159 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
