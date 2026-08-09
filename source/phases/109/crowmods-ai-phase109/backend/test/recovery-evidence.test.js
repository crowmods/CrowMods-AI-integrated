const test=require("node:test");
const assert=require("node:assert/strict");
const {
  DevelopmentRecoverySigner,
  signEvidence
}=require("../src/recovery-evidence");

test("recovery evidence gets a digest and signature",()=>{
  const signer=new DevelopmentRecoverySigner(
    "test-secret"
  );

  const result=signEvidence({
    evidence:{
      state:"RESTORED",
      provider:"kms"
    },
    signer
  });

  assert.equal(
    result.digest.length,
    64
  );
  assert.equal(
    result.signature.length>0,
    true
  );
});
