const test=require("node:test");
const assert=require("node:assert/strict");
const {
  AwsKmsIntegration,
  AzureKmsIntegration,
  GcpKmsIntegration
}=require("../src/kms-integrations");

test("AWS isolated integration signs",async()=>{
  const r=await new AwsKmsIntegration({
    async sign(){return {signature:"s",keyVersion:"v1"};}
  }).sign({digest:"d"});
  assert.equal(r.status,"SUCCESS");
  assert.equal(r.provider,"AWS_KMS");
});

test("Azure isolated integration verifies",async()=>{
  const r=await new AzureKmsIntegration({
    async verify(){return {valid:true};}
  }).verify({digest:"d",signature:"s"});
  assert.equal(r.status,"SUCCESS");
});

test("GCP isolated integration fails closed",async()=>{
  const r=await new GcpKmsIntegration(null).sign({digest:"d"});
  assert.equal(r.status,"BLOCKED");
});
