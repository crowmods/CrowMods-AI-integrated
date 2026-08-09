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

function createDigest(bundle){
  return crypto
    .createHash("sha256")
    .update(canonicalize(bundle))
    .digest("hex");
}

module.exports={
  canonicalize,
  createDigest
};
