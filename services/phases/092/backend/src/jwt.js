function decodeBase64Url(value){
  const normalized=String(value)
    .replace(/-/g,"+")
    .replace(/_/g,"/");

  const padded=normalized+
    "=".repeat((4-normalized.length%4)%4);

  return Buffer.from(padded,"base64").toString("utf8");
}

function decodeJwtParts(token){
  const parts=String(token).split(".");

  if(parts.length!==3)
    throw new Error("Malformed JWT");

  return {
    header:JSON.parse(decodeBase64Url(parts[0])),
    payload:JSON.parse(decodeBase64Url(parts[1])),
    signature:parts[2],
    signingInput:`${parts[0]}.${parts[1]}`
  };
}

function validateClaims({
  payload,
  issuer,
  audience,
  now=Math.floor(Date.now()/1000),
  clockSkewSeconds=60
}){
  if(payload.iss!==issuer)
    return {valid:false,reason:"issuer_mismatch"};

  const audiences=Array.isArray(payload.aud)
    ?payload.aud
    :[payload.aud];

  if(!audiences.includes(audience))
    return {valid:false,reason:"audience_mismatch"};

  if(payload.exp===undefined ||
     Number(payload.exp)+clockSkewSeconds<Number(now))
    return {valid:false,reason:"expired"};

  if(payload.nbf!==undefined &&
     Number(payload.nbf)-clockSkewSeconds>Number(now))
    return {valid:false,reason:"not_yet_valid"};

  if(!payload.sub)
    return {valid:false,reason:"subject_missing"};

  return {valid:true};
}

function selectJwksKey(keys,kid,algorithm){
  return keys.find(key=>
    key.kid===kid &&
    key.algorithm===algorithm &&
    key.active!==false
  )||null;
}

module.exports={
  decodeJwtParts,
  validateClaims,
  selectJwksKey
};
