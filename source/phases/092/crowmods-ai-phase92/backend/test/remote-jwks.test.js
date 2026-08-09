const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryJwksTransport
}=require("../src/remote-jwks");

test("memory JWKS transport returns configured document",async()=>{
  const transport=new MemoryJwksTransport();

  transport.set("https://issuer/jwks",{
    keys:[{kid:"k1",alg:"RS256",kty:"RSA"}]
  });

  const result=await transport.fetch(
    "https://issuer/jwks"
  );

  assert.equal(result.keys[0].kid,"k1");
});
