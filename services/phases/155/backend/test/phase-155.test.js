const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-155");

test("phase 155 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,155);
 assert.equal(r.feature,'Approval Conflict Resolution');
});

test("phase 155 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
