const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evidenceHash,
  buildEvidence
}=require("../src/evidence");

test("same evidence produces deterministic hash",()=>{
  assert.equal(
    evidenceHash({a:1,b:2}),
    evidenceHash({a:1,b:2})
  );
});

test("evidence record contains hash",()=>{
  const result=buildEvidence({
    evidenceType:"RBAC_REPORT",
    generatedBy:"system",
    data:{count:2}
  });

  assert.equal(
    typeof result.evidenceHash,
    "string"
  );
});
