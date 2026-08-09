const crypto=require("crypto");

function createAttestation({
 evidenceHash,
 algorithm="SHA256-DIGEST",
 signerReference
}){
 if(!evidenceHash||!signerReference)
  return {status:"REJECTED"};

 /*
  This is an attestation envelope, not a private-key signature.
  Production signing should use a managed signing service or HSM.
 */
 const attestation=crypto.createHash("sha256")
  .update(`${algorithm}:${evidenceHash}:${signerReference}`)
  .digest("hex");

 return {
  status:"CREATED",
  algorithm,
  evidenceHash,
  attestation,
  signerReference
 };
}

function verifyAttestation({
 evidenceHash,
 algorithm,
 signerReference,
 attestation
}){
 if(!evidenceHash||!signerReference||!attestation)
  return {state:"REJECTED"};

 const expected=crypto.createHash("sha256")
  .update(`${algorithm}:${evidenceHash}:${signerReference}`)
  .digest("hex");

 return {
  state:expected===attestation?"VERIFIED":"REJECTED"
 };
}

module.exports={createAttestation,verifyAttestation};
