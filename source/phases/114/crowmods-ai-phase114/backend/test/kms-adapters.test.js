const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateAdapterConfig
}=require("../src/kms-adapters");

test("supported KMS adapter config validates",()=>{
  assert.equal(
    validateAdapterConfig({
      provider:"AWS_KMS",
      keyReference:"alias/security"
    }).status,
    "VALID"
  );
});

test("unsupported provider is blocked",()=>{
  assert.equal(
    validateAdapterConfig({
      provider:"UNKNOWN",
      keyReference:"key"
    }).status,
    "BLOCKED"
  );
});
