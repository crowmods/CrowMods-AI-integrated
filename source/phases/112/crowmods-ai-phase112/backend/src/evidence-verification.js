const crypto=require("crypto");

function verifyDigestSignature({
  digest,
  signature,
  verifier
}){
  if(!digest||!signature||!verifier)
    return {
      status:"BLOCKED",
      reason:"verification_inputs_missing"
    };

  try{
    return {
      status:verifier.verify(
        digest,
        signature
      )
        ?"VERIFIED"
        :"FAILED"
    };
  }catch{
    return {
      status:"BLOCKED",
      reason:"verifier_unavailable"
    };
  }
}

class DevelopmentEvidenceVerifier{
  constructor(secret="development-only"){
    this.secret=secret;
    this.keyVersion="dev-verify-v1";
  }

  verify(digest,signature){
    const expected=crypto
      .createHmac("sha256",this.secret)
      .update(digest)
      .digest("hex");

    if(expected.length!==String(signature).length)
      return false;

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(signature))
    );
  }
}

module.exports={
  verifyDigestSignature,
  DevelopmentEvidenceVerifier
};
