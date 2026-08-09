const test=require("node:test");
const assert=require("node:assert/strict");
const {
  DevelopmentKMSAdapter,
  DevelopmentWORMAdapter
}=require("../src/providers");

test("development KMS signs and verifies",async()=>{
  const kms=new DevelopmentKMSAdapter();

  const signed=await kms.sign("payload");

  assert.equal(
    await kms.verify(
      "payload",
      signed.signature,
      signed.keyVersion
    ),
    true
  );
});

test("WORM adapter rejects duplicate objects",async()=>{
  const worm=new DevelopmentWORMAdapter();

  await worm.put("audit-1","data","2099-01-01T00:00:00Z");

  await assert.rejects(
    worm.put("audit-1","new-data","2099-01-01T00:00:00Z")
  );
});
