const crypto=require("crypto");

function base64UrlToBuffer(value){
  const normalized=String(value)
    .replace(/-/g,"+")
    .replace(/_/g,"/");

  return Buffer.from(
    normalized+
    "=".repeat(
      (4-normalized.length%4)%4
    ),
    "base64"
  );
}

function rsaJwkToPublicKey(jwk){
  if(!jwk||jwk.kty!=="RSA")
    throw new Error("RSA JWK required");

  const keyObject=crypto.createPublicKey({
    key:{
      kty:"RSA",
      n:jwk.n,
      e:jwk.e
    },
    format:"jwk"
  });

  return keyObject.export({
    type:"spki",
    format:"pem"
  });
}

module.exports={
  base64UrlToBuffer,
  rsaJwkToPublicKey
};
