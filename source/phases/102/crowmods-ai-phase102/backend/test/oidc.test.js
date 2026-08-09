const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateOidcMetadata
}=require("../src/oidc");

test("secure OIDC metadata passes",()=>{
  const result=validateOidcMetadata({
    issuer:"https://issuer.example",
    jwks_uri:"https://issuer.example/jwks"
  });

  assert.equal(result.status,"PASS");
});

test("HTTP JWKS is rejected",()=>{
  const result=validateOidcMetadata({
    issuer:"https://issuer.example",
    jwks_uri:"http://issuer.example/jwks"
  });

  assert.equal(result.status,"FAIL");
});
