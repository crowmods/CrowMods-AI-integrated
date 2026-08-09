const test=require("node:test");
const assert=require("node:assert/strict");
const {verifyTakeoverResult}=require("../src/verified-takeover");

test("exactly one updated row confirms takeover",()=>{
  const r=verifyTakeoverResult({
    expectedVersion:8,
    databaseResult:{
      affectedRows:1,
      committedVersion:9
    }
  });
  assert.equal(r.status,"TAKEN_OVER");
});

test("zero updated rows are conflict",()=>{
  const r=verifyTakeoverResult({
    expectedVersion:8,
    databaseResult:{
      affectedRows:0,
      committedVersion:null
    }
  });
  assert.equal(r.status,"CONFLICT");
});
