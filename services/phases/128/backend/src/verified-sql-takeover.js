async function executeVerifiedTakeover(
  pool,
  {
    runKey,
    expectedVersion,
    newWorkerId,
    newLeaseToken,
    newLeaseExpiresAt
  }
){
  const result=await pool.query(
    `SELECT * FROM execute_verified_takeover($1,$2,$3,$4,$5)`,
    [
      runKey,
      expectedVersion,
      newWorkerId,
      newLeaseToken,
      newLeaseExpiresAt
    ]
  );

  if(result.rowCount!==1)
    return {
      status:"REJECTED",
      reason:"unexpected_function_result"
    };

  const row=result.rows[0];
  const affectedRows=Number(row.affected_rows);
  const committedVersion=
    row.committed_version===null
      ?null:Number(row.committed_version);

  if(row.result!=="TAKEN_OVER" ||
     affectedRows!==1 ||
     committedVersion!==Number(expectedVersion)+1)
    return {
      status:row.result==="CONFLICT"
        ?"CONFLICT":"REJECTED",
      affectedRows,
      committedVersion,
      reason:"takeover_verification_failed"
    };

  return {
    status:"TAKEN_OVER",
    affectedRows,
    committedVersion
  };
}

module.exports={executeVerifiedTakeover};
