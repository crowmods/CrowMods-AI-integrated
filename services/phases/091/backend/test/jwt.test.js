const test=require("node:test");
const assert=require("node:assert/strict");
const {
  decodeJwtParts,
  validateClaims,
  selectJwksKey
}=require("../src/jwt");

function b64(value){
  return Buffer.from(JSON.stringify(value))
    .toString("base64url");
}

test("JWT parts can be decoded",()=>{
  const token=[
    b64({alg:"RS256",kid:"k1"}),
    b64({
      iss:"https://issuer",
      aud:"crowmods",
      sub:"user-1",
      exp:2000
    }),
    "signature"
  ].join(".");

  const result=decodeJwtParts(token);

  assert.equal(result.header.kid,"k1");
  assert.equal(result.payload.sub,"user-1");
});

test("claims are accepted when valid",()=>{
  const result=validateClaims({
    payload:{
      iss:"https://issuer",
      aud:"crowmods",
      sub:"user-1",
      exp:2000
    },
    issuer:"https://issuer",
    audience:"crowmods",
    now:1900
  });

  assert.equal(result.valid,true);
});

test("issuer mismatch is rejected",()=>{
  const result=validateClaims({
    payload:{
      iss:"wrong",
      aud:"crowmods",
      sub:"user-1",
      exp:2000
    },
    issuer:"https://issuer",
    audience:"crowmods",
    now:1900
  });

  assert.equal(result.reason,"issuer_mismatch");
});

test("JWKS key is selected by kid and algorithm",()=>{
  const key=selectJwksKey(
    [
      {kid:"a",algorithm:"RS256",active:true},
      {kid:"b",algorithm:"RS256",active:true}
    ],
    "b",
    "RS256"
  );

  assert.equal(key.kid,"b");
});
