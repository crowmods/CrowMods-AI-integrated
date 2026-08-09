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

function digestEvidence(value){
  return crypto
    .createHash("sha256")
    .update(canonicalize(value))
    .digest("hex");
}

class DevelopmentEvidenceSigner{
  constructor({secret="development-evidence-secret"}={}){
    this.secret=secret;
    this.keyVersion="dev-evidence-v1";
  }

  sign(digest){
    return {
      signature:crypto
        .createHmac("sha256",this.secret)
        .update(digest)
        .digest("hex"),
      keyVersion:this.keyVersion,
      algorithm:"HMAC-SHA256",
      mode:"SIMULATION"
    };
  }

  verify(digest,signature){
    const expected=this.sign(digest).signature;
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(signature))
    );
  }
}

function buildSignedEvidence({
  evidenceType,
  data,
  createdBy,
  signer
}){
  const digest=digestEvidence(data);
  const signed=signer.sign(digest);

  return {
    evidenceType,
    digest,
    signature:signed.signature,
    keyVersion:signed.keyVersion,
    algorithm:signed.algorithm,
    createdBy
  };
}

module.exports={
  canonicalize,
  digestEvidence,
  DevelopmentEvidenceSigner,
  buildSignedEvidence
};
