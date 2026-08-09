use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function OidcOperations(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/oidc-operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / OIDC</p>
      <h1>OIDC Verification Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Validations / 24h",data?.validations24h],
          ["Key Rollovers / 30d",data?.rollovers30d],
          ["Cached JWKS Documents",data?.cachedJwksDocuments]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Remote JWKS retrieval, unknown-kid refresh, RSA signature
        verification, issuer/audience enforcement, and rollover tracking.
      </p>
    </div>
  </main>;
}
