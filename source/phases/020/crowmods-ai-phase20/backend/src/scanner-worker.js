/*
  Security worker contract.

  This file intentionally does not execute or dynamically load APKs.

  Production scanner:
  1. Downloads a quarantined object using a narrowly scoped identity.
  2. Verifies SHA-256.
  3. Runs static analysis inside an isolated sandbox/container/VM.
  4. Enforces CPU, memory, disk and timeout limits.
  5. Uses restricted/no network access unless a scanner explicitly requires it.
  6. Stores scanner evidence and verdict.
  7. Never promotes a file to public storage automatically from a model guess.
*/

async function scanArtifact({objectKey,expectedSha256}) {
  return {
    status:"NOT_IMPLEMENTED",
    objectKey,
    expectedSha256,
    message:"Connect an approved static-analysis/malware-scanning service in an isolated worker."
  };
}

module.exports={scanArtifact};
