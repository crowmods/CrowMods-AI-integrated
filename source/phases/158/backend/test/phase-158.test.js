const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-158");

test("phase 158 accepts valid control input",()=>{
 const r=evaluate({actorId:"operator",reason:"controlled change"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,158);
 assert.equal(r.feature,'Replay Anomaly Detection');
});

test("phase 158 fails closed when actor is missing",()=>{
 const r=evaluate({reason:"controlled change"});
 assert.equal(r.state,"REJECTED");
});
