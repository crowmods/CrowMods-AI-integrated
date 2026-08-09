function validateOidcMetadata(metadata){
  if(!metadata||typeof metadata!=="object")
    return {
      status:"FAIL",
      reason:"metadata_missing"
    };

  const required=[
    "issuer",
    "jwks_uri"
  ];

  const missing=required.filter(
    key=>!metadata[key]
  );

  if(missing.length)
    return {
      status:"FAIL",
      reason:"required_metadata_missing",
      missing
    };

  let jwks;
  try{
    jwks=new URL(metadata.jwks_uri);
  }catch{
    return {
      status:"FAIL",
      reason:"invalid_jwks_uri"
    };
  }

  if(jwks.protocol!=="https:")
    return {
      status:"FAIL",
      reason:"jwks_must_use_https"
    };

  return {
    status:"PASS",
    issuer:metadata.issuer,
    jwksUri:metadata.jwks_uri
  };
}

module.exports={
  validateOidcMetadata
};
