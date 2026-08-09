function transition({
 state="NORMAL",
 escalationCount=0,
 cap=3,
 healthyCycles=0,
 warningHits=2,
 criticalHits=4,
 recoveryCycles=3
}){
 let s=state;
 let count=Math.max(0,Number(escalationCount));
 const healthy=Math.max(0,Number(healthyCycles));

 if(s==="CAPPED" && healthy>=recoveryCycles){
  return {state:"RECOVERING",escalationCount:0};
 }

 if(s==="RECOVERING" && healthy>=recoveryCycles){
  return {state:"NORMAL",escalationCount:0};
 }

 if(s==="WARNING" && count>=criticalHits){
  if(count>=cap) return {state:"CAPPED",escalationCount:count};
  return {state:"CRITICAL",escalationCount:count};
 }

 if(s==="NORMAL" && count>=warningHits)
  return {state:"WARNING",escalationCount:count};

 if(s==="CRITICAL" && count>=cap)
  return {state:"CAPPED",escalationCount:count};

 return {state:s,escalationCount:count};
}
module.exports={transition};
