const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-189");

test("phase 189 accepts controlled input",()=>{
 const r=evaluate({actorId:"operator",value:"baseline"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,189);
});

test("phase 189 rejects missing actor",()=>{
 const r=evaluate({value:"x"});
 assert.equal(r.state,"REJECTED");
});
