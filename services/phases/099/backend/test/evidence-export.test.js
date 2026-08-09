const test=require("node:test");
const assert=require("node:assert/strict");
const {
  digestBundle,
  DevelopmentEvidenceExportSigner,
  createBundle
}=require("../src/evidence-export");

test("bundle digest is deterministic",()=>{
  assert.equal(
    digestBundle([{b:2,a:1}]),
    digestBundle([{a:1,b:2}])
  );
});

test("export bundle signature verifies",()=>{
  const signer=new DevelopmentEvidenceExportSigner({
    secret:"test"
  });

  const bundle=createBundle({
    bundleType:"SECURITY_EVIDENCE",
    records:[{id:1},{id:2}],
    createdBy:"tester",
    signer
  });

  assert.equal(
    signer.verify(
      bundle.digest,
      bundle.signature
    ),
    true
  );
});

test("tampered signature fails",()=>{
  const signer=new DevelopmentEvidenceExportSigner({
    secret:"test"
  });

  const bundle=createBundle({
    bundleType:"SECURITY_EVIDENCE",
    records:[{id:1}],
    createdBy:"tester",
    signer
  });

  assert.equal(
    signer.verify(
      bundle.digest,
      "tampered"
    ),
    false
  );
});
