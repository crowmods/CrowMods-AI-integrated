class WorkloadIdentityProvider{
  constructor({
    name,
    issuer,
    audience
  }={}){
    this.name=name||null;
    this.issuer=issuer||null;
    this.audience=audience||null;
  }

  configurationStatus(){
    const configured=Boolean(
      this.name&&
      this.issuer&&
      this.audience
    );

    return {
      status:configured?"PASS":"BLOCKED",
      provider:this.name,
      issuer:this.issuer,
      audience:this.audience
    };
  }

  async exchange(){
    throw new Error(
      "Implement approved workload-identity adapter"
    );
  }

  async validate(){
    throw new Error(
      "Implement approved workload-identity adapter"
    );
  }
}

module.exports={
  WorkloadIdentityProvider
};
