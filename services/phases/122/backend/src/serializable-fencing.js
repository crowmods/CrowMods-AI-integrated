function validateSerializableCommit({
  resourceKey,
  expectedResourceKey,
  observedVersion,
  currentVersion,
  nextVersion,
  payloadDigest,
  expectedPayloadDigest
}){
  if(resourceKey!==expectedResourceKey)
    return {status:"ABORTED",reason:"resource_mismatch"};

  if(observedVersion!==currentVersion)
    return {status:"ABORTED",reason:"concurrent_version_change"};

  if(nextVersion!==currentVersion+1)
    return {status:"ABORTED",reason:"invalid_version_transition"};

  if(!payloadDigest || payloadDigest!==expectedPayloadDigest)
    return {status:"ABORTED",reason:"payload_integrity_failure"};

  return {
    status:"COMMITTED",
    committedVersion:nextVersion
  };
}

module.exports={validateSerializableCommit};
