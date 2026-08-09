const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-160");

test("phase 160 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,160);
 assert.equal(r.feature,'Approval/Replay Reliability Dashboard');
});

test("phase 160 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
