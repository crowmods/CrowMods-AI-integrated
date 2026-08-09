function buildBatch({exports=[],batchSize=100}){
 const size=Math.min(500,Math.max(1,Number(batchSize)||100));
 const selected=exports.slice(0,size);
 return {
  batchSize:size,
  examinedCount:selected.length,
  exportIds:selected.map(x=>x.exportId)
 };
}
module.exports={buildBatch};
