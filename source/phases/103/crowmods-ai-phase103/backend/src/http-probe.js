async function probeHttps(url,{
  timeoutMs=3000,
  fetchImpl=globalThis.fetch
}={}){
  let parsed;

  try{
    parsed=new URL(url);
  }catch{
    return {
      status:"FAIL",
      reason:"invalid_url"
    };
  }

  if(parsed.protocol!=="https:")
    return {
      status:"FAIL",
      reason:"https_required"
    };

  const controller=new AbortController();
  const timer=setTimeout(
    ()=>controller.abort(),
    timeoutMs
  );

  const started=Date.now();

  try{
    const response=await fetchImpl(url,{
      method:"GET",
      redirect:"error",
      signal:controller.signal,
      headers:{
        "accept":"application/json"
      }
    });

    return {
      status:response.ok
        ?"PASS"
        :"FAIL",
      statusCode:response.status,
      latencyMs:Date.now()-started
    };
  }catch(error){
    return {
      status:"FAIL",
      reason:error.name==="AbortError"
        ?"timeout"
        :"network_error",
      latencyMs:Date.now()-started
    };
  }finally{
    clearTimeout(timer);
  }
}

module.exports={
  probeHttps
};
