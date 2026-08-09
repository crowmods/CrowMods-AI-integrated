const test=require("node:test");
const assert=require("node:assert/strict");
const {
  ProductionKmsAdapter
}=require("../src/kms-adapter");

test("configured KMS adapter passes",()=>{
  const adapter=new ProductionKmsAdapter({
    provider:"approved-kms",
    keyId:"key-1",
    algorithm:"RSA-PSS-SHA256"
  });

  assert.equal(
    adapter.configurationStatus().status,
    "PASS"
  );
});

test("missing KMS configuration blocks",()=>{
  const adapter=new ProductionKmsAdapter();

  assert.equal(
    adapter.configurationStatus().status,
    "BLOCKED"
  );
});
