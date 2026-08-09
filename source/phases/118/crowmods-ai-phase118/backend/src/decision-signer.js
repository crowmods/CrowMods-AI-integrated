const crypto=require("crypto");

class DecisionSigner{
  constructor(secret="development-only"){
    this.secret=secret;
    this.keyVersion="dev-governance-v1";
    this.algorithm="HMAC-SHA256";
  }

  sign(value){
    return crypto
      .createHmac("sha256",this.secret)
      .update(value)
      .digest("hex");
  }
}

module.exports={
  DecisionSigner
};
