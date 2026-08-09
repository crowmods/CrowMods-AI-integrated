const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateRemediation,
  canClose
}=require("../src/remediation");

test("remediation requires owner",()=>{
  assert.equal(
    validateRemediation({
      title:"Fix JWKS configuration",
      severity:"HIGH",
      owner:"security"
    }).valid,
    true
  );
});

test("resolved item can close",()=>{
  assert.equal(
    canClose("RESOLVED"),
    true
  );
});

test("in-progress item cannot close",()=>{
  assert.equal(
    canClose("IN_PROGRESS"),
    false
  );
});
