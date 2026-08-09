const test=require("node:test");
const assert=require("node:assert/strict");
const {
  DevelopmentHealthSigner,
  signHealthEvidence
}=require("../src/health-signing");

test("health evidence verifies",()=>{
  const signer=new DevelopmentHealthSigner({
    secret:"test"
  });

  const evidence=signHealthEvidence({
    data:{
      status:"PASS",
      probe:"JWKS"
    },
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
