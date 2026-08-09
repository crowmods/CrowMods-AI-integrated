function parseCacheControl(value=""){
  const directives=String(value)
    .split(",")
    .map(v=>v.trim());

  let maxAge=null;

  for(const directive of directives){
    const match=directive.match(
      /^max-age\s*=\s*(\d+)$/i
    );

    if(match){
      maxAge=Number(match[1]);
    }
  }

  return {
    maxAgeSeconds:maxAge
  };
}

function validateJwksUri({
  uri,
  allowedHosts=[]
}){
  let parsed;

  try{
    parsed=new URL(uri);
  }catch{
    return {
      valid:false,
      reason:"invalid_uri"
    };
  }

  if(parsed.protocol!=="https:")
    return {
      valid:false,
      reason:"https_required"
    };

  if(
    allowedHosts.length &&
    !allowedHosts.includes(parsed.hostname)
  ){
    return {
      valid:false,
      reason:"host_not_allowed"
    };
  }

  return {
    valid:true,
    hostname:parsed.hostname
  };
}

class HardenedJwksHttpTransport{
  constructor({
    fetchImpl,
    allowedHosts=[],
    timeoutMs=5000,
    maxBytes=1024*1024
  }){
    this.fetchImpl=fetchImpl;
    this.allowedHosts=allowedHosts;
    this.timeoutMs=timeoutMs;
    this.maxBytes=maxBytes;
  }

  async fetch(uri){
    const validation=validateJwksUri({
      uri,
      allowedHosts:this.allowedHosts
    });

    if(!validation.valid)
      throw new Error(validation.reason);

    if(typeof this.fetchImpl!=="function")
      throw new Error("fetch implementation required");

    const controller=new AbortController();
    const timer=setTimeout(
      ()=>controller.abort(),
      this.timeoutMs
    );

    try{
      const response=await this.fetchImpl(uri,{
        method:"GET",
        redirect:"error",
        signal:controller.signal,
        headers:{
          accept:"application/json"
        }
      });

      if(!response.ok)
        throw new Error(
          `jwks_http_${response.status}`
        );

      const cacheControl=response.headers?.get?.(
        "cache-control"
      )||"";

      const cache=parseCacheControl(
        cacheControl
      );

      const text=await response.text();

      if(
        Buffer.byteLength(text,"utf8")>
        this.maxBytes
      )
        throw new Error("jwks_response_too_large");

      const document=JSON.parse(text);

      return {
        document,
        cacheControl,
        maxAgeSeconds:cache.maxAgeSeconds
      };
    }finally{
      clearTimeout(timer);
    }
  }
}

module.exports={
  parseCacheControl,
  validateJwksUri,
  HardenedJwksHttpTransport
};
