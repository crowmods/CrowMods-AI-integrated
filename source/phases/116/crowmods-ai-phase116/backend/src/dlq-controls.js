function replayDlq({
  deadLetter,
  requestedBy,
  replayKey
}){
  if(!deadLetter||
     deadLetter.status!=="OPEN")
    return {
      status:"BLOCKED",
      reason:"dlq_item_not_replayable"
    };

  if(!requestedBy||!replayKey)
    return {
      status:"BLOCKED",
      reason:"replay_identity_required"
    };

  return {
    status:"REPLAYED",
    deadLetterId:deadLetter.id,
    replayedBy:requestedBy,
    replayKey
  };
}

function quarantineDlq({
  deadLetter,
  quarantinedBy,
  reason
}){
  if(!deadLetter||
     deadLetter.status!=="OPEN")
    return {
      status:"BLOCKED",
      reason:"dlq_item_not_quarantinable"
    };

  if(!quarantinedBy||!reason)
    return {
      status:"BLOCKED",
      reason:"quarantine_metadata_required"
    };

  return {
    status:"QUARANTINED",
    deadLetterId:deadLetter.id,
    quarantinedBy,
    reason
  };
}

module.exports={
  replayDlq,
  quarantineDlq
};
