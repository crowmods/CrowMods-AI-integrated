class JwksTransport{
  async fetch(_uri){
    throw new Error("fetch not implemented");
  }
}

class MemoryJwksTransport extends JwksTransport{
  constructor(){
    super();
    this.documents=new Map();
  }

  set(uri,document){
    this.documents.set(
      uri,
      JSON.parse(JSON.stringify(document))
    );
  }

  async fetch(uri){
    const document=this.documents.get(uri);

    if(!document)
      throw new Error("JWKS document not found");

    return JSON.parse(JSON.stringify(document));
  }
}

module.exports={
  JwksTransport,
  MemoryJwksTransport
};
