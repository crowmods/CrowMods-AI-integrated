use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function AuthorizationCenter(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/authorization-operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / AUTHORIZATION</p>
      <h1>Security Boundary</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(2,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Authorization Events / 24h</strong>
          <h2>{data?.authorizationEvents24h??"—"}</h2>
        </article>

        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>JWKS Transport Events / 24h</strong>
          <h2>{data?.jwksTransportEvents24h??"—"}</h2>
        </article>
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Hardened JWKS transport, validated-claim role extraction,
        reusable authorization middleware, and protected API boundaries.
      </p>
    </div>
  </main>;
}
