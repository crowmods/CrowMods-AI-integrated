function enforceTakeoverResult({
  expectedVersion,
  affectedRows,
  committedVersion
}){
  const rows=Number(affectedRows);
  const committed=Number(committedVersion);
  const expected=Number(expectedVersion);

  if(rows!==1)
    return {
      status:"CONFLICT",
      reason:"affected_row_count_mismatch"
    };

  if(!Number.isFinite(committed) ||
     committed!==expected+1)
    return {
      status:"REJECTED",
      reason:"committed_version_mismatch"
    };

  return {
    status:"TAKEN_OVER",
    committedVersion:committed
  };
}

module.exports={enforceTakeoverResult};
