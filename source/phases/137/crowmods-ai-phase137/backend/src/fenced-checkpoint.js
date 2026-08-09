async function writeCheckpoint(pool,args){
 const q=await pool.query(
  `SELECT * FROM fenced_checkpoint_write($1,$2,$3,$4,$5,$6)`,
  [
   args.modelKey,args.ownerId,args.fencingVersion,
   args.expectedCheckpoint,args.action,args.windowSize
  ]
 );
 const r=q.rows[0];
 return {
  status:r.result,
  checkpointVersion:r.checkpoint_version==null
   ?null:Number(r.checkpoint_version)
 };
}
module.exports={writeCheckpoint};
