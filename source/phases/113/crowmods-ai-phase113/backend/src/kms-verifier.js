function validateKmsResponse({
  verified,
  provider,
  keyReference
}){
  if(!provider||!keyReference)
    return {
      status:"BLOCKED",
      reason:"kms_metadata_missing"
    };

  if(typeof verified!=="boolean")
    return {
      status:"BLOCKED",
      reason:"kms_verification_result_missing"
    };

  return {
    status:verified?"VERIFIED":"FAILED",
    provider,
    keyReference
  };
}

class KmsVerificationAdapter{
  constructor({
    provider,
    keyReference
  }){
    this.provider=provider;
    this.keyReference=keyReference;
  }

  async verify(){
    throw new Error(
      "KMS adapter implementation required"
    );
  }
}

module.exports={
  validateKmsResponse,
  KmsVerificationAdapter
};
