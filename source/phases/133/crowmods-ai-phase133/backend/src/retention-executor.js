function buildPurgePlan({
  records=[],
  now=new Date(),
  retentionDays=30,
  batchSize=100,
  dryRun=false
}){
  const cutoff=new Date(new Date(now).getTime()-Number(retentionDays)*86400000);
  const eligible=records.filter(r=>{
    const d=new Date(r.createdAt);
    return !Number.isNaN(d.getTime()) && d<cutoff;
  }).slice(0,Math.max(1,Number(batchSize)||100));

  return {
    dryRun,
    batchSize:Math.max(1,Number(batchSize)||100),
    examinedCount:Math.min(records.length,Math.max(1,Number(batchSize)||100)),
    eligibleCount:eligible.length,
    recordKeys:eligible.map(r=>String(r.key))
  };
}
module.exports={buildPurgePlan};
