async function bind(pool,args){
 const q=await pool.query(
  `SELECT * FROM bind_calibration_cas($1,$2,$3,$4,$5)`,
  [
   args.modelKey,args.ownerId,args.fencingVersion,
   args.expectedFencingVersion,args.checkpointVersion
  ]
 );
 const r=q.rows[0];
 return {
  status:r.result,
  fencingVersion:r.fencing_version==null
   ?null:Number(r.fencing_version)
 };
}
module.exports={bind};
