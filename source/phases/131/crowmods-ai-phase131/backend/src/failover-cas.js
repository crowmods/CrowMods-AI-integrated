async function failoverWithCas(pool,{workerKey,expectedVersion,newWorkerId,newLeaseToken,newLeaseExpiresAt}){
 const q=await pool.query(`SELECT * FROM failover_worker_cas($1,$2,$3,$4,$5)`,[
  workerKey,expectedVersion,newWorkerId,newLeaseToken,newLeaseExpiresAt
 ]);
 if(q.rowCount!==1) return {status:"REJECTED",reason:"unexpected_result"};
 const r=q.rows[0];
 return {status:r.result,committedVersion:r.committed_version===null?null:Number(r.committed_version),affectedRows:Number(r.affected_rows)};
}
async function renewWithCas(pool,{workerKey,workerId,leaseToken,expectedVersion,newLeaseExpiresAt}){
 const q=await pool.query(`SELECT * FROM renew_worker_lease_cas($1,$2,$3,$4,$5)`,[
  workerKey,workerId,leaseToken,expectedVersion,newLeaseExpiresAt
 ]);
 if(q.rowCount!==1) return {status:"REJECTED",reason:"unexpected_result"};
 const r=q.rows[0];
 return {status:r.result,committedVersion:Number(r.committed_version),affectedRows:Number(r.affected_rows)};
}
module.exports={failoverWithCas,renewWithCas};
