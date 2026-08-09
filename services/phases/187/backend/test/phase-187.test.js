const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/phase-187");

test("phase 187 accepts controlled input",()=>{
 const r=evaluate({actorId:"operator",value:"baseline"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,187);
});

test("phase 187 rejects missing actor",()=>{
 const r=evaluate({value:"x"});
 assert.equal(r.state,"REJECTED");
});
