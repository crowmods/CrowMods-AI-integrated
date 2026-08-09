const test=require("node:test");
const assert=require("node:assert/strict");
const {
  AwsKmsAdapter,
  AzureKeyVaultAdapter,
  GcpKmsAdapter
}=require("../src/cloud-kms");

test("AWS adapter signs through client",async()=>{
  const result=await new AwsKmsAdapter({
    async sign(){
      return {
        signature:"sig",
        keyVersion:"v1"
      };
    }
  }).sign({
    keyReference:"key",
    digest:"digest",
    algorithm:"RSA-PSS"
  });

  assert.equal(result.status,"SUCCESS");
  assert.equal(result.provider,"AWS_KMS");
});

test("Azure adapter verifies through client",async()=>{
  const result=await new AzureKeyVaultAdapter({
    async verify(){
      return {valid:true};
    }
  }).verify({
    keyReference:"key",
    digest:"digest",
    signature:"sig",
    algorithm:"RSA-PSS"
  });

  assert.equal(result.status,"SUCCESS");
  assert.equal(result.valid,true);
});

test("GCP adapter fails closed without client",async()=>{
  const result=await new GcpKmsAdapter(null).sign({
    keyReference:"key",
    digest:"digest",
    algorithm:"RSA-PSS"
  });

  assert.equal(result.status,"BLOCKED");
});
