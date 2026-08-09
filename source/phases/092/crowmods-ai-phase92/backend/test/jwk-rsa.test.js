const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("crypto");
const {
  rsaJwkToPublicKey
}=require("../src/jwk-rsa");

test("RSA JWK converts to public key",()=>{
  const pair=crypto.generateKeyPairSync("rsa",{
    modulusLength:2048
  });

  const jwk=pair.publicKey.export({
    format:"jwk"
  });

  const pem=rsaJwkToPublicKey(jwk);

  assert.equal(
    pem.includes("BEGIN PUBLIC KEY"),
    true
  );
});
