function certificateStatus({
  daysRemaining,
  valid=true
}){
  if(!valid)
    return {
      status:"FAIL",
      severity:"HIGH",
      reason:"certificate_invalid"
    };

  if(daysRemaining<=0)
    return {
      status:"FAIL",
      severity:"HIGH",
      reason:"certificate_expired"
    };

  if(daysRemaining<=7)
    return {
      status:"WARN",
      severity:"HIGH",
      reason:"certificate_expires_within_7_days"
    };

  if(daysRemaining<=30)
    return {
      status:"WARN",
      severity:"MEDIUM",
      reason:"certificate_expires_within_30_days"
    };

  return {
    status:"PASS",
    severity:null,
    reason:"certificate_valid"
  };
}

module.exports={
  certificateStatus
};
