function verifyPersistedIntegrity({
  expectedPayloadHash,
  expectedManifestHash,
  actualPayloadHash,
  actualManifestHash
}){
  const verified=
    expectedPayloadHash===actualPayloadHash &&
    expectedManifestHash===actualManifestHash;

  return {
    status:verified?"VERIFIED":"MISMATCH",
    verifiedAt:verified?new Date().toISOString():null
  };
}

module.exports={verifyPersistedIntegrity};
