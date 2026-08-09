function discoveryDocument({
  issuer,
  authorizationEndpoint,
  tokenEndpoint,
  jwksUri
}){
  return {
    issuer,
    authorization_endpoint:authorizationEndpoint,
    token_endpoint:tokenEndpoint,
    jwks_uri:jwksUri
  };
}

function mapExternalRoles({
  issuer,
  externalRoles,
  mappings
}){
  const allowed=mappings
    .filter(m=>
      m.issuer===issuer &&
      m.enabled!==false
    );

  const internal=[];

  for(const role of externalRoles){
    for(const mapping of allowed){
      if(mapping.externalRole===role)
        internal.push(mapping.internalRole);
    }
  }

  return [...new Set(internal)];
}

function validateIssuer({
  expectedIssuer,
  tokenIssuer
}){
  return String(expectedIssuer)===
    String(tokenIssuer);
}

module.exports={
  discoveryDocument,
  mapExternalRoles,
  validateIssuer
};
