function verifyTakeoverResult({
  expectedVersion,
  databaseResult
}){
  if(!databaseResult)
    return {
      status:"REJECTED",
      reason:"missing_database_result"
    };

  if(Number(databaseResult.affectedRows)!==1)
    return {
      status:"CONFLICT",
      reason:"takeover_not_applied"
    };

  if(Number(databaseResult.committedVersion)!==
     Number(expectedVersion)+1)
    return {
      status:"CONFLICT",
      reason:"unexpected_committed_version"
    };

  return {
    status:"TAKEN_OVER",
    committedVersion:
      Number(databaseResult.committedVersion)
  };
}

module.exports={verifyTakeoverResult};
