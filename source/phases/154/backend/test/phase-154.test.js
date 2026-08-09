const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-154");

test("phase 154 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,154);
 assert.equal(r.feature,'Automatic Policy Rollback');
});

test("phase 154 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
