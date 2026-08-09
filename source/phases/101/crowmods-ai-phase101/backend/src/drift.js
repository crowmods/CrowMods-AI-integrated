function canonicalize(value){
  if(value===null||typeof value!=="object")
    return JSON.stringify(value);

  if(Array.isArray(value))
    return `[${value.map(canonicalize).join(",")}]`;

  return `{${Object.keys(value).sort().map(key=>
    `${JSON.stringify(key)}:${canonicalize(value[key])}`
  ).join(",")}}`;
}

function detectDrift(expected,observed){
  return canonicalize(expected)!==
    canonicalize(observed);
}

module.exports={
  canonicalize,
  detectDrift
};
