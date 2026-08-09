function validateSessionResponse({
  action,
  reason
}){
  if(!["SUSPEND","END"].includes(action))
    return {
      valid:false,
      reason:"invalid_session_action"
    };

  if(!reason||String(reason).trim().length<3)
    return {
      valid:false,
      reason:"response_reason_required"
    };

  return {
    valid:true
  };
}

module.exports={
  validateSessionResponse
};
