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

function digestBundle(records){
  return crypto
    .createHash("sha256")
    .update(canonicalize(records))
    .digest("hex");
}

class DevelopmentEvidenceExportSigner{
  constructor({
    secret="development-export-secret"
  }={}){
    this.secret=secret;
    this.keyVersion="dev-export-v1";
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

    if(String(signature).length!==expected.length)
      return false;

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(signature))
    );
  }
}

function createBundle({
  bundleType,
  records,
  createdBy,
  signer
}){
  const digest=digestBundle(records);
  const signature=signer.sign(digest);

  return {
    bundleType,
    digest,
    signature,
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm,
    recordCount:records.length,
    createdBy
  };
}

module.exports={
  canonicalize,
  digestBundle,
  DevelopmentEvidenceExportSigner,
  createBundle
};
