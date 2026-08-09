const test=require("node:test");
const assert=require("node:assert/strict");
const {
  discoveryDocument,
  mapExternalRoles,
  validateIssuer
}=require("../src/oidc");

test("discovery document contains issuer and JWKS",()=>{
  const result=discoveryDocument({
    issuer:"https://idp.example",
    authorizationEndpoint:"https://idp.example/auth",
    tokenEndpoint:"https://idp.example/token",
    jwksUri:"https://idp.example/jwks"
  });

  assert.equal(result.issuer,"https://idp.example");
  assert.equal(result.jwks_uri,"https://idp.example/jwks");
});

test("external roles map to internal roles",()=>{
  const result=mapExternalRoles({
    issuer:"issuer",
    externalRoles:["ops-admin"],
    mappings:[
      {
        issuer:"issuer",
        externalRole:"ops-admin",
        internalRole:"ops.admin",
        enabled:true
      }
    ]
  });

  assert.deepEqual(result,["ops.admin"]);
});

test("issuer validation rejects mismatch",()=>{
  assert.equal(
    validateIssuer({
      expectedIssuer:"a",
      tokenIssuer:"b"
    }),
    false
  );
});
