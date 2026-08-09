function buildFencingHeaders({
  resourceKey,
  tokenVersion,
  token
}){
  if(!resourceKey||
     !Number.isInteger(tokenVersion)||
     !token)
    return {
      status:"BLOCKED",
      reason:"fencing_propagation_metadata_missing"
    };

  return {
    status:"READY",
    headers:{
      "x-resource-key":resourceKey,
      "x-fencing-version":String(tokenVersion),
      "x-fencing-token":token
    }
  };
}

function validateDownstreamFencing({
  expectedResource,
  expectedVersion,
  resourceKey,
  tokenVersion,
  tokenValid
}){
  if(resourceKey!==expectedResource)
    return {
      accepted:false,
      reason:"resource_mismatch"
    };

  if(tokenVersion!==expectedVersion)
    return {
      accepted:false,
      reason:"stale_downstream_fencing_version"
    };

  if(tokenValid!==true)
    return {
      accepted:false,
      reason:"downstream_token_invalid"
    };

  return {
    accepted:true
  };
}

module.exports={
  buildFencingHeaders,
  validateDownstreamFencing
};
