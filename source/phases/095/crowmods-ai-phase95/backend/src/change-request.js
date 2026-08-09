function validateChangeRequest({
  requestedBy,
  changeType,
  proposedChange
}){
  if(!requestedBy)
    return {
      valid:false,
      reason:"requested_by_required"
    };

  if(!changeType)
    return {
      valid:false,
      reason:"change_type_required"
    };

  if(!proposedChange||
     typeof proposedChange!=="object"){
    return {
      valid:false,
      reason:"proposed_change_required"
    };
  }

  return {
    valid:true
  };
}

function canApprove({
  identity,
  requestedBy
}){
  if(!identity?.authenticated)
    return false;

  return identity.subject!==requestedBy &&
    identity.roles.includes("ops.rbac.approver");
}

module.exports={
  validateChangeRequest,
  canApprove
};
