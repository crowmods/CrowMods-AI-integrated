const crypto=require("crypto");

function algorithmConfig(algorithm){
  const configs={
    RS256:{
      digest:"RSA-SHA256",
      keyType:"rsa"
    },
    RS384:{
      digest:"RSA-SHA384",
      keyType:"rsa"
    },
    RS512:{
      digest:"RSA-SHA512",
      keyType:"rsa"
    }
  };

  return configs[algorithm]||null;
}

function verifyRsaSignature({
  signingInput,
  signatureBase64Url,
  publicKey,
  algorithm
}){
  const config=algorithmConfig(algorithm);

  if(!config)
    throw new Error("Unsupported algorithm");

  const signature=Buffer.from(
    String(signatureBase64Url)
      .replace(/-/g,"+")
      .replace(/_/g,"/")+
      "=".repeat(
        (4-String(signatureBase64Url).length%4)%4
      ),
    "base64"
  );

  const verifier=crypto.createVerify(
    config.digest
  );

  verifier.update(signingInput);
  verifier.end();

  return verifier.verify(
    publicKey,
    signature
  );
}

module.exports={
  algorithmConfig,
  verifyRsaSignature
};
