function validateWorkloadIdentity({
  subject,
  audience,
  expectedAudience,
  issuer,
  expectedIssuer
}){
  if(!subject||!audience)
    return {
      status:"REJECTED",
      reason:"subject_and_audience_required"
    };

  if(expectedAudience&&audience!==expectedAudience)
    return {
      status:"REJECTED",
      reason:"audience_mismatch"
    };

  if(expectedIssuer&&issuer!==expectedIssuer)
    return {
      status:"REJECTED",
      reason:"issuer_mismatch"
    };

  return {
    status:"ACCEPTED",
    subject,
    audience,
    issuer:issuer||null
  };
}

module.exports={
  validateWorkloadIdentity
};
