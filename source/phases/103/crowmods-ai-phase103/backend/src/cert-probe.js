function inspectCertificate({
  daysRemaining,
  trusted=true
}){
  if(!trusted)
    return {
      status:"FAIL",
      reason:"certificate_chain_untrusted"
    };

  if(!Number.isFinite(daysRemaining))
    return {
      status:"BLOCKED",
      reason:"certificate_expiry_unknown"
    };

  if(daysRemaining<=0)
    return {
      status:"FAIL",
      reason:"certificate_expired"
    };

  if(daysRemaining<=7)
    return {
      status:"WARN",
      reason:"certificate_expiring_within_7_days"
    };

  if(daysRemaining<=30)
    return {
      status:"WARN",
      reason:"certificate_expiring_within_30_days"
    };

  return {
    status:"PASS",
    reason:"certificate_healthy"
  };
}

module.exports={
  inspectCertificate
};
