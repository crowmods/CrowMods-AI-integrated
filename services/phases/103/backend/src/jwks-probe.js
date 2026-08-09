const {
  probeHttps
}=require("./http-probe");

async function probeJwks(url,options={}){
  const result=await probeHttps(
    url,
    options
  );

  if(result.status!=="PASS")
    return {
      ...result,
      probeType:"JWKS"
    };

  return {
    ...result,
    probeType:"JWKS",
    securityChecks:{
      https:true,
      redirectPolicy:"strict"
    }
  };
}

module.exports={
  probeJwks
};
