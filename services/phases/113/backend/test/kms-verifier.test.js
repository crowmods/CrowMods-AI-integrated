const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateKmsResponse
}=require("../src/kms-verifier");

test("valid KMS verification is accepted",()=>{
  const result=validateKmsResponse({
    verified:true,
    provider:"approved-kms",
    keyReference:"key/security-evidence"
  });

  assert.equal(result.status,"VERIFIED");
});

test("missing KMS metadata is blocked",()=>{
  const result=validateKmsResponse({
    verified:true
  });

  assert.equal(result.status,"BLOCKED");
});
