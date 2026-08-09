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

class DevelopmentHealthSigner{
  constructor({secret="health-development-secret"}={}){
    this.secret=secret;
    this.keyVersion="dev-health-v1";
    this.algorithm="HMAC-SHA256";
  }

  sign(digest){
    return crypto
      .createHmac("sha256",this.secret)
      .update(digest)
      .digest("hex");
  }

  verify(digest,signature){
    const expected=this.sign(digest);

    if(expected.length!==String(signature).length)
      return false;

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(signature))
    );
  }
}

function signHealthEvidence({
  data,
  signer
}){
  const digest=digestEvidence(data);

  return {
    digest,
    signature:signer.sign(digest),
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm
  };
}

module.exports={
  canonicalize,
  digestEvidence,
  DevelopmentHealthSigner,
  signHealthEvidence
};
