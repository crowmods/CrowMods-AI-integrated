const test=require("node:test");
const assert=require("node:assert/strict");
const {
  ProductionKmsVerifier
}=require("../src/kms-verifier");

test("unconfigured verifier fails closed",async()=>{
  const result=await new ProductionKmsVerifier({
    provider:"AWS_KMS",
    keyReference:"key",
    client:null
  }).verifyDigest({
    digest:"d",
    signature:"s",
    algorithm:"RSA-PSS"
  });

  assert.equal(result.status,"BLOCKED");
});

test("valid KMS signature verifies",async()=>{
  const result=await new ProductionKmsVerifier({
    provider:"AWS_KMS",
    keyReference:"key",
    client:{
      async verify(){
        return {valid:true};
      }
    }
  }).verifyDigest({
    digest:"d",
    signature:"s",
    algorithm:"RSA-PSS"
  });

  assert.equal(result.status,"VALID");
});
