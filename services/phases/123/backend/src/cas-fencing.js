function compareAndSwapFence({
  resourceKey,
  expectedResourceKey,
  storedVersion,
  expectedVersion,
  nextVersion,
  payloadDigest,
  expectedPayloadDigest
}){
  if(resourceKey!==expectedResourceKey)
    return {status:"ABORTED",reason:"resource_mismatch"};

  if(storedVersion!==expectedVersion)
    return {status:"ABORTED",reason:"compare_and_swap_conflict"};

  if(nextVersion!==expectedVersion+1)
    return {status:"ABORTED",reason:"invalid_version_increment"};

  if(!payloadDigest ||
     payloadDigest!==expectedPayloadDigest)
    return {status:"ABORTED",reason:"payload_integrity_failure"};

  return {
    status:"COMMITTED",
    committedVersion:nextVersion
  };
}

module.exports={compareAndSwapFence};
