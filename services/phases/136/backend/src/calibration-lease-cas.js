async function acquire(pool,args){
 const q=await pool.query(
  `SELECT * FROM acquire_calibration_lease_cas($1,$2,$3,$4,$5)`,
  [args.modelKey,args.ownerId,args.leaseToken,
   args.expectedVersion,args.leaseExpiresAt]
 );
 const r=q.rows[0];
 return {
  status:r.result,
  fencingVersion:r.fencing_version==null
   ?null:Number(r.fencing_version)
 };
}

async function renew(pool,args){
 const q=await pool.query(
  `SELECT * FROM renew_calibration_lease_cas($1,$2,$3,$4,$5)`,
  [args.modelKey,args.ownerId,args.leaseToken,
   args.expectedVersion,args.leaseExpiresAt]
 );
 const r=q.rows[0];
 return {
  status:r.result,
  fencingVersion:r.fencing_version==null
   ?null:Number(r.fencing_version)
 };
}

module.exports={acquire,renew};
