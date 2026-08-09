const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-157");

test("phase 157 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,157);
 assert.equal(r.feature,'Replay Fingerprint Registry');
});

test("phase 157 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
