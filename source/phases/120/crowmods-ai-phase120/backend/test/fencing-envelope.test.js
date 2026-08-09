const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createEnvelope,
  verifyEnvelope
}=require("../src/fencing-envelope");

class Signer{
  constructor(){
    this.algorithm="TEST";
    this.keyVersion="v1";
  }
  sign(value){
    return `sig:${value}`;
  }
}

class Verifier{
  verify(value,signature){
    return signature===`sig:${value}`;
  }
}

test("fencing envelope binds payload",()=>{
  const envelope=createEnvelope({
    resourceKey:"job-1",
    tokenVersion:2,
    payload:{action:"execute"},
    expiresAt:"2027-01-01T00:00:00Z",
    signer:new Signer()
  });

  assert.equal(envelope.status,"CREATED");

  const result=verifyEnvelope({
    envelope,
    payload:{action:"execute"},
    expectedResourceKey:"job-1",
    expectedTokenVersion:2,
    verifier:new Verifier(),
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.valid,true);
});

test("tampered payload is rejected",()=>{
  const envelope=createEnvelope({
    resourceKey:"job-1",
    tokenVersion:2,
    payload:{action:"execute"},
    expiresAt:"2027-01-01T00:00:00Z",
    signer:new Signer()
  });

  const result=verifyEnvelope({
    envelope,
    payload:{action:"delete"},
    expectedResourceKey:"job-1",
    expectedTokenVersion:2,
    verifier:new Verifier(),
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.reason,"payload_digest_mismatch");
});
