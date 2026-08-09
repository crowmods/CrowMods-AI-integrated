function transitionPolicy({
 currentState="DRAFT",
 action,
 actorId,
 reason
}){
 const allowed={
  DRAFT:new Set(["ACTIVATE"]),
  ACTIVE:new Set(["ROLLBACK"]),
  ROLLED_BACK:new Set([])
 };

 if(!actorId||!reason||!allowed[currentState]?.has(action))
  return {status:"REJECTED"};

 return {
  status:"ACCEPTED",
  state:action==="ACTIVATE"?"ACTIVE":"ROLLED_BACK",
  actorId,
  reason
 };
}
module.exports={transitionPolicy};
