const test=require("node:test");
const assert=require("node:assert/strict");
const {
  digestExport,
  signDigest,
  verifySignature
}=require("../src/audit-export");

test("audit digest is deterministic",()=>{
  const events=[{
    id:1,
    actor:"operator",
    action:"view",
    allowed:true
  }];

  assert.equal(
    digestExport(events),
    digestExport(events)
  );
});

test("audit signature verifies",()=>{
  const digest=digestExport([{id:1}]);
  const signature=signDigest(
    digest,
    "development-secret"
  );

  assert.equal(
    verifySignature(
      digest,
      signature,
      "development-secret"
    ),
    true
  );
});
