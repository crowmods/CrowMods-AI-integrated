function reconcile({
 auditOutcome=null,
 executionOutcome=null
}){
 if(auditOutcome===null)
   return {result:"MISSING_AUDIT"};

 if(executionOutcome===null)
   return {result:"MISSING_OUTCOME"};

 return auditOutcome===executionOutcome
  ?{result:"MATCH"}
  :{result:"MISMATCH"};
}
module.exports={reconcile};
