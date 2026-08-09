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

function digestSnapshot(snapshot){
  return crypto
    .createHash("sha256")
    .update(canonicalize(snapshot))
    .digest("hex");
}

function createSnapshot({
  incidentId,
  version,
  events,
  signer
}){
  const snapshot={
    incidentId,
    version,
    events
  };

  const digest=digestSnapshot(snapshot);

  return {
    snapshot,
    digest,
    signature:signer.sign(digest),
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm,
    eventCount:events.length
  };
}

class DevelopmentSnapshotSigner{
  constructor(secret="development-only"){
    this.secret=secret;
    this.keyVersion="dev-timeline-v1";
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
  digestSnapshot,
  createSnapshot,
  DevelopmentSnapshotSigner
};
