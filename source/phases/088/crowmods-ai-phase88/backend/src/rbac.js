const permissions={
  VIEW:"ops.view",
  ACK:"incident.ack",
  RESOLVE:"incident.resolve",
  ESCALATE:"incident.escalate",
  REPLAY_DLQ:"notification.dlq.replay",
  MODIFY_SLO:"slo.modify",
  ADMIN:"ops.admin"
};

function can(assignedPermissions,required){
  return assignedPermissions.includes(
    required
  )||assignedPermissions.includes(
    permissions.ADMIN
  );
}

function requirePermission(assignedPermissions,required){
  return {
    allowed:can(
      assignedPermissions,
      required
    ),
    required
  };
}

module.exports={
  permissions,
  can,
  requirePermission
};
