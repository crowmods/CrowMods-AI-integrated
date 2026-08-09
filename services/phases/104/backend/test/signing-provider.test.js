const test=require("node:test");
const assert=require("node:assert/strict");
const {
  SigningProvider,
  DevelopmentSigningProvider
}=require("../src/signing-provider");

test("unconfigured provider reports blocked configuration",()=>{
  const provider=new SigningProvider();
  assert.equal(
    provider.configurationStatus().configured,
    false
  );
});

test("development provider signs and verifies",async()=>{
  const provider=new DevelopmentSigningProvider({
    secret:"test-secret"
  });

  const signature=await provider.sign("digest");

  assert.equal(
    await provider.verify(
      "digest",
      signature
    ),
    true
  );
});
