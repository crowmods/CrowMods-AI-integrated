function isEligible({createdAt,retentionDays,now=new Date()}){
 const created=new Date(createdAt);
 const current=new Date(now);
 const days=Number(retentionDays);
 if(Number.isNaN(created.getTime())||!Number.isFinite(days)||days<=0)
   return {eligible:false,reason:"invalid_input"};
 const cutoff=current.getTime()-days*86400000;
 return created.getTime()<cutoff
   ?{eligible:true,reason:"retention_expired"}
   :{eligible:false,reason:"retention_active"};
}
module.exports={isEligible};
