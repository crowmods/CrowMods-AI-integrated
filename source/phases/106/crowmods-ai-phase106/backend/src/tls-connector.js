class LiveTlsConnector{
  constructor({
    allowlist=[]
  }={}){
    this.allowlist=new Set(
      allowlist
    );
  }

  isAllowed(host){
    return this.allowlist.has(host);
  }

  async inspect(){
    throw new Error(
      "Implement approved TLS connector"
    );
  }
}

function validateTlsConnectorConfig({
  allowlist=[]
}={}){
  return {
    status:
      Array.isArray(allowlist)&&
      allowlist.length>0
        ?"PASS"
        :"BLOCKED",
    allowlist
  };
}

module.exports={
  LiveTlsConnector,
  validateTlsConnectorConfig
};
