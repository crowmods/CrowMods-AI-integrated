function transition({
 currentState="OPEN",
 nextState,
 actorId,
 evidence={}
}){
 const allowed={
  OPEN:new Set(["UNDER_REVIEW","REJECTED"]),
  UNDER_REVIEW:new Set(["RELEASED","REPROCESSING","REJECTED"]),
  REPROCESSING:new Set(["RESOLVED","OPEN"]),
  RELEASED:new Set([]),
  REJECTED:new Set([]),
  RESOLVED:new Set([])
 };

 if(!actorId||!allowed[currentState]?.has(nextState))
   return {status:"REJECTED"};

 return {
  status:"TRANSITIONED",
  fromState:currentState,
  toState:nextState,
  actorId,
  evidence
 };
}
module.exports={transition};
