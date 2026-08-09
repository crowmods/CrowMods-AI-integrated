function approvalState(approvals=[]){
  const approved=new Set(
    approvals
      .filter(item=>item.decision==="APPROVED")
      .map(item=>item.approver)
  );

  const rejected=approvals.some(
    item=>item.decision==="REJECTED"
  );

  return {
    approvedBy:[...approved],
    rejected,
    approved:!rejected&&approved.size>=2
  };
}

function canApprove({
  subject,
  requester,
  roles=[]
}){
  return subject &&
    subject!==requester &&
    roles.includes("ops.rbac.approver");
}

module.exports={
  approvalState,
  canApprove
};
