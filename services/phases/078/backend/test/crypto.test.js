const test=require("node:test");
const assert=require("node:assert/strict");
const {Ed25519MemoryKeyProvider}=require("../src/crypto-provider");

test("ed25519 signature verifies",async()=>{
  const provider=new Ed25519MemoryKeyProvider();
  const payload="crowmods-evidence";

  const signed=await provider.sign(payload);

  assert.equal(
    await provider.verify(
      payload,
      signed.signature,
      signed.keyVersion
    ),
    true
  );
});

test("tampered payload fails verification",async()=>{
  const provider=new Ed25519MemoryKeyProvider();

  const signed=await provider.sign("original");

  assert.equal(
    await provider.verify(
      "tampered",
      signed.signature,
      signed.keyVersion
    ),
    false
  );
});

test("rotation creates a new active version",async()=>{
  const provider=new Ed25519MemoryKeyProvider();

  provider.rotate();

  const key=await provider.currentKey();

  assert.equal(key.keyVersion,2);
});
