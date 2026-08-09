const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildFencingHeaders,
  validateDownstreamFencing
}=require("../src/downstream-fencing");

test("fencing headers are propagated",()=>{
  const result=buildFencingHeaders({
    resourceKey:"job-1",
    tokenVersion:3,
    token:"token"
  });

  assert.equal(result.status,"READY");
  assert.equal(result.headers["x-fencing-version"],"3");
});

test("downstream accepts matching fencing",()=>{
  assert.equal(
    validateDownstreamFencing({
      expectedResource:"job-1",
      expectedVersion:3,
      resourceKey:"job-1",
      tokenVersion:3,
      tokenValid:true
    }).accepted,
    true
  );
});
