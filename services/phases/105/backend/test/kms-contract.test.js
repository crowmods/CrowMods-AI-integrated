const test=require("node:test");
const assert=require("node:assert/strict");
const {
  ProductionKmsContract
}=require("../src/kms-contract");

test("complete KMS configuration passes",()=>{
  const kms=new ProductionKmsContract({
    provider:"approved-kms",
    keyId:"key-1",
    algorithm:"RSA-PSS-SHA256"
  });

  assert.equal(kms.validate().status,"PASS");
});

test("missing KMS configuration is blocked",()=>{
  const kms=new ProductionKmsContract();

  assert.equal(kms.validate().status,"BLOCKED");
});
