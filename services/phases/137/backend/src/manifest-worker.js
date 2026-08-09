function buildWorkerBatch({
 exports=[],
 batchSize=100
}){
 const size=Math.min(250,Math.max(1,Number(batchSize)||100));
 const batch=exports.slice(0,size);
 return {
  batchSize:size,
  examinedCount:batch.length,
  exportIds:batch.map(x=>x.exportId)
 };
}
module.exports={buildWorkerBatch};
