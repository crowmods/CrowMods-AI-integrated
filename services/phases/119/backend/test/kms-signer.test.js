const test=require("node:test");
const assert=require("node:assert/strict");
const {
  ProductionKmsSigner
}=require("../src/kms-signer");

test("unconfigured KMS signer fails closed",async()=>{
  const result=await new ProductionKmsSigner({
    provider:"AWS_KMS",
    keyReference:"key",
    client:null
  }).signDigest("digest");

  assert.equal(result.status,"BLOCKED");
});

test("KMS adapter returns signature",async()=>{
  const result=await new ProductionKmsSigner({
    provider:"AWS_KMS",
    keyReference:"key",
    client:{
      async sign(){
        return {
          signature:"signed",
          keyVersion:"v2",
          algorithm:"RSA-PSS"
        };
      }
    }
  }).signDigest("digest");

  assert.equal(result.status,"SIGNED");
  assert.equal(result.keyVersion,"v2");
});
