async function commit(pool,args){
 const q=await pool.query(
  `SELECT * FROM renew_and_commit_calibration(
    $1,$2,$3,$4,$5,$6,$7,$8
  )`,
  [
   args.modelKey,
   args.ownerId,
   args.leaseToken,
   args.fencingVersion,
   args.expectedCheckpoint,
   args.newLeaseExpiry,
   args.action,
   args.windowSize
  ]
 );
 const r=q.rows[0];
 return {
  status:r.result,
  newCheckpointVersion:r.new_checkpoint_version==null
   ?null:Number(r.new_checkpoint_version)
 };
}
module.exports={commit};
