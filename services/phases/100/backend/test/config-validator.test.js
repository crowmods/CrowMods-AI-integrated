const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateProductionConfig
}=require("../src/config-validator");

test("production HTTPS configuration passes",()=>{
  const result=validateProductionConfig({
    NODE_ENV:"production",
    OIDC_ISSUER:"https://issuer.example",
    OIDC_AUDIENCE:"crowmods",
    OIDC_JWKS_URI:"https://issuer.example/.well-known/jwks.json",
    OIDC_JWKS_HOSTS:"issuer.example",
    DATABASE_URL:"postgresql://example",
    EVIDENCE_KMS_KEY_ID:"kms-key",
    SIEM_ENDPOINT:"https://siem.example"
  });

  assert.equal(
    result.every(
      check=>check.status==="PASS"
    ),
    true
  );
});

test("missing production secrets are blocked",()=>{
  const result=validateProductionConfig({
    NODE_ENV:"production"
  });

  assert.equal(
    result.some(
      check=>check.status==="BLOCKED"
    ),
    true
  );
});

test("HTTP JWKS endpoint fails",()=>{
  const result=validateProductionConfig({
    NODE_ENV:"production",
    OIDC_JWKS_URI:"http://issuer.example/jwks"
  });

  assert.equal(
    result.find(
      check=>check.name==="OIDC_JWKS_URI_HTTPS"
    ).status,
    "FAIL"
  );
});
