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

function manifestHash(manifest){
  return crypto
    .createHash("sha256")
    .update(canonicalize(manifest))
    .digest("hex");
}

function buildManifest({
  releaseVersion,
  controls,
  artifacts
}){
  const manifest={
    releaseVersion,
    controls,
    artifacts
  };

  return {
    ...manifest,
    manifestHash:manifestHash(manifest)
  };
}

module.exports={
  canonicalize,
  manifestHash,
  buildManifest
};
