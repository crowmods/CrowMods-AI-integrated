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

function digestEvidence(evidence){
  return crypto
    .createHash("sha256")
    .update(canonicalize(evidence))
    .digest("hex");
}

function signEvidence({
  evidence,
  signer
}){
  const digest=digestEvidence(
    evidence
  );

  return {
    digest,
    signature:signer.sign(digest),
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm
  };
}

class DevelopmentRecoverySigner{
  constructor(secret="development-only"){
    this.secret=secret;
    this.keyVersion="dev-recovery-v1";
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
  digestEvidence,
  signEvidence,
  DevelopmentRecoverySigner
};
