function buildEligibleRows({
 rows=[],
 retentionDays=30,
 now=new Date()
}){
 const cutoff=new Date(now).getTime()-Number(retentionDays)*86400000;
 return rows.filter(row=>{
  const created=new Date(row.createdAt).getTime();
  return Number.isFinite(created)&&created<cutoff;
 });
}
module.exports={buildEligibleRows};
