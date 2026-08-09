function evaluateQuorum({
 approvals=[],
 requiredApprovals=2,
 now=new Date()
}){
 const current=new Date(now);

 const active=approvals.filter(a=>{
  const expires=new Date(a.expiresAt);
  return a.decision==="APPROVE" &&
    Number.isFinite(expires.getTime()) &&
    expires>current;
 });

 const uniqueActors=new Set(
  active.map(a=>String(a.actorId))
 );

 return {
  approved:uniqueActors.size>=Number(requiredApprovals),
  approvalCount:uniqueActors.size,
  requiredApprovals:Number(requiredApprovals)
 };
}
module.exports={evaluateQuorum};
