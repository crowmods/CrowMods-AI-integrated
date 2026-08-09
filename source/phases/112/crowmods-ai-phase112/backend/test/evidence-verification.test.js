const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("crypto");
const {
  verifyDigestSignature,
  DevelopmentEvidenceVerifier
}=require("../src/evidence-verification");

test("valid signature verifies",()=>{
  const secret="test";
  const digest="abc";
  const signature=crypto
    .createHmac("sha256",secret)
    .update(digest)
    .digest("hex");

  const result=verifyDigestSignature({
    digest,
    signature,
    verifier:new DevelopmentEvidenceVerifier(secret)
  });

  assert.equal(result.status,"VERIFIED");
});

test("invalid signature fails",()=>{
  const result=verifyDigestSignature({
    digest:"abc",
    signature:"bad",
    verifier:new DevelopmentEvidenceVerifier("test")
  });

  assert.equal(result.status,"FAILED");
});
