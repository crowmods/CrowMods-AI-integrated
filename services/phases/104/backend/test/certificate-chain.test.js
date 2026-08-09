const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateCertificateChain
}=require("../src/certificate-chain");

test("trusted matching certificate passes",()=>{
  const result=validateCertificateChain({
    trusted:true,
    hostnameMatches:true,
    notBefore:"2020-01-01",
    notAfter:"2030-01-01",
    now:"2026-01-01"
  });

  assert.equal(result.status,"VALID");
});

test("hostname mismatch fails",()=>{
  const result=validateCertificateChain({
    trusted:true,
    hostnameMatches:false,
    notBefore:"2020-01-01",
    notAfter:"2030-01-01",
    now:"2026-01-01"
  });

  assert.equal(result.status,"INVALID");
});
