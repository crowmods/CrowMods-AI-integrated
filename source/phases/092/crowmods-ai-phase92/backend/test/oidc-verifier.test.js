const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("crypto");
const {
  verifyToken
}=require("../src/oidc-verifier");

function b64(value){
  return Buffer.from(JSON.stringify(value))
    .toString("base64url");
}

test("OIDC verifier validates RS256 token",async()=>{
  const pair=crypto.generateKeyPairSync("rsa",{
    modulusLength:2048
  });

  const jwk=pair.publicKey.export({
    format:"jwk"
  });

  jwk.kid="k1";
  jwk.alg="RS256";

  const header=b64({
    alg:"RS256",
    kid:"k1",
    typ:"JWT"
  });

  const payload=b64({
    iss:"https://issuer",
    aud:"crowmods",
    sub:"operator",
    exp:Math.floor(Date.now()/1000)+600
  });

  const input=`${header}.${payload}`;

  const signer=crypto.createSign("RSA-SHA256");
  signer.update(input);
  signer.end();

  const signature=signer.sign(
    pair.privateKey
  ).toString("base64url");

  const result=await verifyToken({
    token:`${input}.${signature}`,
    issuer:"https://issuer",
    audience:"crowmods",
    keys:[jwk]
  });

  assert.equal(result.valid,true);
  assert.equal(result.subject,"operator");
});
