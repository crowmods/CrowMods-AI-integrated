const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-156");

test("phase 156 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,156);
 assert.equal(r.feature,'Approval Delegation Controls');
});

test("phase 156 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
