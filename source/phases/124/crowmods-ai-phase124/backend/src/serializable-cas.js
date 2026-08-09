async function serializableCas(pool,{
  resourceKey,
  expectedVersion,
  nextDigest
}){
  const client=await pool.connect();

  try{
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    const locked=await client.query(
      `SELECT fencing_version
       FROM protected_resources
       WHERE resource_key=$1
       FOR UPDATE`,
      [resourceKey]
    );

    if(!locked.rowCount){
      await client.query("ROLLBACK");
      return {status:"ABORTED",reason:"resource_not_found"};
    }

    const current=Number(
      locked.rows[0].fencing_version
    );

    if(current!==Number(expectedVersion)){
      await client.query("ROLLBACK");
      return {
        status:"ABORTED",
        reason:"compare_and_swap_conflict",
        currentVersion:current
      };
    }

    const updated=await client.query(
      `UPDATE protected_resources
       SET fencing_version=fencing_version+1,
           state_digest=$2,
           updated_at=NOW()
       WHERE resource_key=$1
         AND fencing_version=$3
       RETURNING fencing_version`,
      [resourceKey,nextDigest,expectedVersion]
    );

    if(!updated.rowCount){
      await client.query("ROLLBACK");
      return {status:"ABORTED",reason:"atomic_update_conflict"};
    }

    await client.query("COMMIT");

    return {
      status:"COMMITTED",
      committedVersion:Number(
        updated.rows[0].fencing_version
      )
    };
  }catch(error){
    try{await client.query("ROLLBACK");}catch{}
    if(error?.code==="40001")
      return {
        status:"ABORTED",
        reason:"serialization_retry_required"
      };
    throw error;
  }finally{
    client.release();
  }
}

module.exports={serializableCas};
