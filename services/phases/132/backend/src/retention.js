function retentionDecision({createdAt,retentionDays,now=new Date()}){
 const created=new Date(createdAt), current=new Date(now);
 if(Number.isNaN(created.getTime()) || retentionDays<=0)
   return {action:"REJECTED"};
 const cutoff=current.getTime()-Number(retentionDays)*86400000;
 return created.getTime()<cutoff
   ?{action:"ELIGIBLE_FOR_PURGE"}
   :{action:"RETAIN"};
}
module.exports={retentionDecision};
