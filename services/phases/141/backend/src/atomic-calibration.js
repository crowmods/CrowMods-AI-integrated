async function commit(pool,args){
 const q=await pool.query(
  `SELECT * FROM atomic_calibration_commit($1,$2,$3,$4,$5,$6)`,
  [
   args.modelKey,args.ownerId,args.fencingVersion,
   args.expectedCheckpoint,args.action,args.windowSize
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
