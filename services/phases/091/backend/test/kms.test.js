const test=require("node:test");
const assert=require("node:assert/strict");
const {MemoryKmsProvider}=require("../src/kms");

test("KMS adapter signs and verifies",async()=>{
  const kms=new MemoryKmsProvider({
    secret:"test-secret"
  });

  const result=await kms.sign("audit-payload");

  assert.equal(
    await kms.verify(
      "audit-payload",
      result.signature
    ),
    true
  );
});

test("KMS key rotation changes version",async()=>{
  const kms=new MemoryKmsProvider();

  const first=await kms.sign("a");

  kms.rotate("new-secret");

  const second=await kms.sign("a");

  assert.notEqual(
    first.keyVersion,
    second.keyVersion
  );
});
