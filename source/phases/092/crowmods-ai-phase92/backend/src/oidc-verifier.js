const {
  decodeJwtParts,
  validateClaims,
  selectJwksKey
}=require("./jwt");
const {
  verifyRsaSignature
}=require("./signature");
const {
  rsaJwkToPublicKey
}=require("./jwk-rsa");

async function verifyToken({
  token,
  issuer,
  audience,
  allowedAlgorithms=["RS256"],
  keys=[],
  refreshKeys
}){
  const decoded=decodeJwtParts(token);
  const algorithm=decoded.header.alg;
  const kid=decoded.header.kid;

  if(!allowedAlgorithms.includes(algorithm)){
    return {
      valid:false,
      reason:"algorithm_not_allowed",
      refreshedJwks:false
    };
  }

  let key=selectJwksKey(
    keys.map(item=>({
      kid:item.kid,
      algorithm:item.alg,
      active:true,
      jwk:item
    })),
    kid,
    algorithm
  );

  let refreshedJwks=false;

  if(!key&&refreshKeys){
    keys=await refreshKeys();
    refreshedJwks=true;

    key=selectJwksKey(
      keys.map(item=>({
        kid:item.kid,
        algorithm:item.alg,
        active:true,
        jwk:item
      })),
      kid,
      algorithm
    );
  }

  if(!key){
    return {
      valid:false,
      reason:"kid_not_found",
      refreshedJwks
    };
  }

  const claims=validateClaims({
    payload:decoded.payload,
    issuer,
    audience
  });

  if(!claims.valid){
    return {
      valid:false,
      reason:claims.reason,
      refreshedJwks
    };
  }

  const publicKey=rsaJwkToPublicKey(
    key.jwk
  );

  const signatureValid=verifyRsaSignature({
    signingInput:decoded.signingInput,
    signatureBase64Url:decoded.signature,
    publicKey,
    algorithm
  });

  return {
    valid:signatureValid,
    reason:signatureValid
      ?null
      :"signature_invalid",
    refreshedJwks,
    subject:decoded.payload.sub,
    issuer:decoded.payload.iss,
    audience:decoded.payload.aud,
    kid,
    algorithm
  };
}

module.exports={
  verifyToken
};
