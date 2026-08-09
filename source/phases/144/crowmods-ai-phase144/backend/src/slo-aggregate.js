function aggregate(samples=[],{
 periodStart,
 periodEnd,
 alertClass="UNKNOWN"
}){
 const filtered=samples.filter(s=>{
  const t=new Date(s.createdAt).getTime();
  return Number.isFinite(t)&&
    (!periodStart||t>=new Date(periodStart).getTime())&&
    (!periodEnd||t<=new Date(periodEnd).getTime())&&
    (!s.alertClass||s.alertClass===alertClass);
 });

 const met=filtered.filter(s=>s.result==="MET").length;
 const missed=filtered.filter(s=>s.result==="MISSED").length;
 const open=filtered.filter(s=>s.result==="OPEN").length;

 return {
  alertClass,
  sampleCount:filtered.length,
  metCount:met,
  missedCount:missed,
  openCount:open,
  complianceRatio:filtered.length
   ?Number((met/filtered.length).toFixed(5)):0
 };
}
module.exports={aggregate};
