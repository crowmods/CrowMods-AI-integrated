const test=require("node:test");
const assert=require("node:assert/strict");
const {createAttestation,verifyAttestation}=require("../src/attestation");

test("attestation verifies",()=>{
 const a=createAttestation({
  evidenceHash:"abc",
  signerReference:"signer-1"
 });

 const r=verifyAttestation({
  evidenceHash:"abc",
  algorithm:a.algorithm,
  signerReference:"signer-1",
  attestation:a.attestation
 });

 assert.equal(r.state,"VERIFIED");
});
