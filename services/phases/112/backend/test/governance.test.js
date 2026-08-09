const test=require("node:test");
const assert=require("node:assert/strict");
const {
  coverage,
  validateMapping
}=require("../src/governance");

test("mapping coverage is calculated",()=>{
  const result=coverage([
    "MAPPED",
    "MAPPED",
    "PARTIAL",
    "UNMAPPED"
  ]);

  assert.equal(result.coveragePercent,50);
});

test("valid mapping passes",()=>{
  assert.equal(
    validateMapping({
      status:"MAPPED",
      requirementKey:"REQ-1",
      controlId:"control-1"
    }).status,
    "VALID"
  );
});
