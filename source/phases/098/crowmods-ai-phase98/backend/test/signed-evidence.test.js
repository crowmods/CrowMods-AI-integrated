const test=require("node:test");
const assert=require("node:assert/strict");
const {
  digestEvidence,
  DevelopmentEvidenceSigner,
  buildSignedEvidence
}=require("../src/signed-evidence");

test("canonical evidence digest is deterministic",()=>{
  assert.equal(
    digestEvidence({b:2,a:1}),
    digestEvidence({a:1,b:2})
  );
});

test("evidence can be signed and verified",()=>{
  const signer=new DevelopmentEvidenceSigner({
    secret:"test-secret"
  });

  const evidence=buildSignedEvidence({
    evidenceType:"SECURITY_REPORT",
    data:{alerts:2},
    createdBy:"system",
    signer
  });

  assert.equal(
    signer.verify(
      evidence.digest,
      evidence.signature
    ),
    true
  );
});

test("tampered digest fails verification",()=>{
  const signer=new DevelopmentEvidenceSigner({
    secret:"test-secret"
  });

  const evidence=buildSignedEvidence({
    evidenceType:"SECURITY_REPORT",
    data:{alerts:2},
    createdBy:"system",
    signer
  });

  assert.equal(
    signer.verify(
      "tampered",
      evidence.signature
    ),
    false
  );
});
