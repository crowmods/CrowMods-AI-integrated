function evaluateSLO({
 incidentStartedAt,
 recoveredAt=null,
 targetSeconds=900,
 now=new Date()
}){
 const start=new Date(incidentStartedAt);
 const end=recoveredAt?new Date(recoveredAt):new Date(now);

 if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))
   return {result:"OPEN",recoverySeconds:null};

 if(!recoveredAt)
   return {result:"OPEN",recoverySeconds:null};

 const seconds=Math.max(
  0,
  Math.floor((end.getTime()-start.getTime())/1000)
 );

 return {
  result:seconds<=Number(targetSeconds)?"MET":"MISSED",
  recoverySeconds:seconds
 };
}
module.exports={evaluateSLO};
