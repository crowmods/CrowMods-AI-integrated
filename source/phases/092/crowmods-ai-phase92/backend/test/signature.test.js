const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("crypto");
const {
  verifyRsaSignature
}=require("../src/signature");

test("RSA SHA-256 signature verifies",()=>{
  const pair=crypto.generateKeyPairSync("rsa",{
    modulusLength:2048
  });

  const input="header.payload";
  const signer=crypto.createSign("RSA-SHA256");
  signer.update(input);
  signer.end();

  const signature=signer.sign(pair.privateKey)
    .toString("base64url");

  assert.equal(
    verifyRsaSignature({
      signingInput:input,
      signatureBase64Url:signature,
      publicKey:pair.publicKey,
      algorithm:"RS256"
    }),
    true
  );
});
