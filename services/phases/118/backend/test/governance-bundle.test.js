const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildBundle
}=require("../src/governance-bundle");
const {
  DecisionSigner
}=require("../src/decision-signer");

test("governance bundle is signed",()=>{
  const result=buildBundle({
    bundleId:"BUNDLE-001",
    manifest:{
      decisions:["DEC-1"],
      evidence:["EV-1"]
    },
    signer:new DecisionSigner("test-secret")
  });

  assert.equal(result.digest.length,64);
  assert.equal(result.signature.length,64);
  assert.equal(result.algorithm,"HMAC-SHA256");
});
