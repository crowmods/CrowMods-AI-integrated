function buildCleanupBatch({
 entries=[],
 batchSize=100,
 now=new Date()
}){
 const size=Math.min(250,Math.max(1,Number(batchSize)||100));
 const current=new Date(now);
 const selected=entries.slice(0,size);
 const expired=selected.filter(x=>{
  const d=new Date(x.expiresAt);
  return Number.isFinite(d.getTime())&&d<=current;
 });

 return {
  examinedCount:selected.length,
  expiredCount:expired.length,
  keys:expired.map(x=>x.idempotencyKey)
 };
}
module.exports={buildCleanupBatch};
