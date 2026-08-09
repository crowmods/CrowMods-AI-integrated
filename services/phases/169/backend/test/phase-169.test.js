const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate,digest}=require("../src/phase-169");

test("phase 169 accepts valid security context",()=>{
 const r=evaluate({actorId:"operator",evidenceHash:"abc"});
 assert.equal(r.state,"READY");
 assert.equal(r.phase,169);
});

test("phase 169 fails closed without required evidence",()=>{
 const r=evaluate({actorId:"operator"});
 assert.equal(r.state,"REJECTED");
});

test("phase 169 produces stable SHA-256 digest",()=>{
 const a=digest("crowmods");
 const b=digest("crowmods");
 assert.equal(a,b);
 assert.equal(a.length,64);
});
