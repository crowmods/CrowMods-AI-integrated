function recalculateQuorum({
 approvals=[],
 requiredApprovals=2
}){
 const activeActors=new Set();

 for(const a of approvals){
  if(a.decision!=="APPROVE" || a.revoked===true) continue;
  const expiry=new Date(a.expiresAt);
  if(!Number.isFinite(expiry.getTime()) ||
     expiry<=new Date()) continue;
  activeActors.add(String(a.actorId));
 }

 const active=activeActors.size;
 return {
  activeApprovals:active,
  requiredApprovals:Number(requiredApprovals),
  state:active>=Number(requiredApprovals)
   ?"APPROVED":"PENDING"
 };
}

function propagateRevocation({
 approvalId,
 actorId,
 reason,
 dependents=[]
}){
 if(!approvalId||!actorId||!reason)
  return {status:"REJECTED"};

 return {
  status:"PROPAGATED",
  approvalId,
  actorId,
  reason,
  dependentCount:dependents.length,
  dependentQueueIds:dependents.map(String)
 };
}

module.exports={recalculateQuorum,propagateRevocation};
