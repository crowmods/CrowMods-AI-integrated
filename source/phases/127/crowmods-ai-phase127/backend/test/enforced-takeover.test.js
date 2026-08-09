const test=require("node:test");
const assert=require("node:assert/strict");
const {enforceTakeoverResult}=require("../src/enforced-takeover");

test("valid database result is accepted",()=>{
  const r=enforceTakeoverResult({
    expectedVersion:5,
    affectedRows:1,
    committedVersion:6
  });
  assert.equal(r.status,"TAKEN_OVER");
});

test("wrong row count conflicts",()=>{
  const r=enforceTakeoverResult({
    expectedVersion:5,
    affectedRows:0,
    committedVersion:6
  });
  assert.equal(r.status,"CONFLICT");
});
