function claimRoles({
  payload,
  roleClaim="roles"
}){
  const raw=payload?.[roleClaim];

  if(Array.isArray(raw))
    return [...new Set(
      raw.filter(
        value=>typeof value==="string"
      )
    )];

  if(typeof raw==="string")
    return [...new Set(
      raw.split(/[\s,]+/)
        .map(value=>value.trim())
        .filter(Boolean)
    )];

  return [];
}

function identityFromValidatedClaims({
  payload,
  roles
}){
  return {
    subject:payload.sub,
    issuer:payload.iss,
    audience:payload.aud,
    roles:[...new Set(roles||[])],
    authenticated:true
  };
}

module.exports={
  claimRoles,
  identityFromValidatedClaims
};
