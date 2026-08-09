function validateCertificateChain({
  trusted,
  hostnameMatches,
  notBefore,
  notAfter,
  now=new Date()
}){
  if(!trusted)
    return {
      status:"INVALID",
      reason:"untrusted_chain"
    };

  if(!hostnameMatches)
    return {
      status:"INVALID",
      reason:"hostname_mismatch"
    };

  const current=new Date(now);
  const start=new Date(notBefore);
  const end=new Date(notAfter);

  if(Number.isNaN(start.getTime())||
     Number.isNaN(end.getTime()))
    return {
      status:"BLOCKED",
      reason:"certificate_dates_unavailable"
    };

  if(current<start)
    return {
      status:"INVALID",
      reason:"certificate_not_yet_valid"
    };

  if(current>end)
    return {
      status:"INVALID",
      reason:"certificate_expired"
    };

  return {
    status:"VALID",
    reason:"certificate_chain_valid"
  };
}

module.exports={
  validateCertificateChain
};
