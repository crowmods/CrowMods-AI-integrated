use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function CryptoIntegrity(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/crypto/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CRYPTO INTEGRITY</p>
      <h1>Cryptographic Evidence</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Signing Keys</strong>
          <h2>{data?.signingKeys??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Evidence Signatures</strong>
          <h2>{data?.signatures??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Immutable Exports</strong>
          <h2>{data?.immutableExports??"—"}</h2>
        </article>
      </section>
    </div>
  </main>;
}
