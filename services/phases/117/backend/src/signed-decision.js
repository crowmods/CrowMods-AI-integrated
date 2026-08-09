const crypto=require("crypto");

function canonicalize(value){
  if(value===null||typeof value!=="object")
    return JSON.stringify(value);

  if(Array.isArray(value))
    return `[${value.map(canonicalize).join(",")}]`;

  return `{${Object.keys(value).sort().map(key=>
    `${JSON.stringify(key)}:${canonicalize(value[key])}`
  ).join(",")}}`;
}

function signDecisionEvidence({
  decision,
  evidence=[],
  signer
}){
  const payload={
    decision,
    evidence
  };

  const digest=crypto
    .createHash("sha256")
    .update(canonicalize(payload))
    .digest("hex");

  return {
    digest,
    signature:signer.sign(digest),
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm,
    evidence:payload
  };
}

class DevelopmentDecisionSigner{
  constructor(secret="development-only"){
    this.secret=secret;
    this.keyVersion="dev-decision-v1";
    this.algorithm="HMAC-SHA256";
  }

  sign(digest){
    return crypto
      .createHmac("sha256",this.secret)
      .update(digest)
      .digest("hex");
  }
}

module.exports={
  canonicalize,
  signDecisionEvidence,
  DevelopmentDecisionSigner
};
