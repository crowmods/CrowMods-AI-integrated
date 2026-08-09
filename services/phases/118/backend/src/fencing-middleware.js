function enforceFencing({
  resourceKey,
  presentedVersion,
  currentVersion,
  tokenStatus,
  expiresAt,
  now=new Date()
}){
  if(!resourceKey||
     !Number.isInteger(presentedVersion)||
     !Number.isInteger(currentVersion))
    return {
      allowed:false,
      result:"BLOCKED",
      reason:"fencing_metadata_missing"
    };

  if(tokenStatus!=="ACTIVE")
    return {
      allowed:false,
      result:"BLOCKED",
      reason:"token_not_active"
    };

  if(presentedVersion!==currentVersion)
    return {
      allowed:false,
      result:"BLOCKED",
      reason:"stale_fencing_token"
    };

  const expiry=new Date(expiresAt);
  if(Number.isNaN(expiry.getTime())||
     expiry<=new Date(now))
    return {
      allowed:false,
      result:"BLOCKED",
      reason:"token_expired"
    };

  return {
    allowed:true,
    result:"ALLOWED",
    resourceKey
  };
}

function fencingMiddleware(){
  return (req,res,next)=>{
    const result=enforceFencing({
      resourceKey:req.header("x-resource-key"),
      presentedVersion:Number(
        req.header("x-fencing-version")
      ),
      currentVersion:Number(
        req.header("x-current-fencing-version")
      ),
      tokenStatus:req.header("x-fencing-status"),
      expiresAt:req.header("x-fencing-expires-at")
    });

    if(!result.allowed)
      return res.status(409).json(result);

    req.fencing=result;
    next();
  };
}

module.exports={
  enforceFencing,
  fencingMiddleware
};
