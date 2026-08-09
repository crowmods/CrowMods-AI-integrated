use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function IdentityCrypto(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/crypto-operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / IDENTITY & CRYPTO</p>
      <h1>Identity & Cryptographic Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Token Validations / 24h",data?.tokenValidations24h],
          ["Active JWKS Keys",data?.activeJwksKeys],
          ["Active Signing Keys",data?.activeSigningKeys],
          ["KMS Mode",data?.kms?.mode]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        JWT claims validation, JWKS cache/rotation, key selection,
        KMS signing abstraction, and audit signature verification.
      </p>
    </div>
  </main>;
}
