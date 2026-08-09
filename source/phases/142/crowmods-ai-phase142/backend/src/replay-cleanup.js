function classifyCleanup({
 entries=[],
 now=new Date()
}){
 const current=new Date(now);
 let removed=0;
 let conflicts=0;

 for(const entry of entries){
  if(entry.conflict===true) conflicts++;
  const expiry=new Date(entry.expiresAt);
  if(Number.isFinite(expiry.getTime()) && expiry<=current)
   removed++;
 }

 return {
  examinedCount:entries.length,
  removedCount:removed,
  conflictCount:conflicts
 };
}
module.exports={classifyCleanup};
