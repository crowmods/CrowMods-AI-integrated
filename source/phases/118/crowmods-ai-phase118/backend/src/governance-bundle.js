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

function buildBundle({
  bundleId,
  manifest,
  signer
}){
  if(!bundleId||!manifest||!signer)
    throw new Error("bundle_inputs_required");

  const canonical=canonicalize({
    bundleId,
    manifest
  });

  const digest=crypto
    .createHash("sha256")
    .update(canonical)
    .digest("hex");

  return {
    bundleId,
    digest,
    signature:signer.sign(digest),
    keyVersion:signer.keyVersion,
    algorithm:signer.algorithm,
    manifest
  };
}

module.exports={
  canonicalize,
  buildBundle
};
