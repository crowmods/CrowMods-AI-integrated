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

function createSignedBundle({
  reportType,
  version,
  report,
  evidence=[],
  signer
}){
  const bundle={
    reportType,
    version,
    report,
    evidence
  };

  const digest=crypto
    .createHash("sha256")
    .update(canonicalize(bundle))
    .digest("hex");

  return {
    bundle,
    digest,
    signature:signer.sign(digest),
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm
  };
}

class DevelopmentBundleSigner{
  constructor(secret="development-only"){
    this.secret=secret;
    this.keyVersion="dev-bundle-v1";
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
  createSignedBundle,
  DevelopmentBundleSigner
};
