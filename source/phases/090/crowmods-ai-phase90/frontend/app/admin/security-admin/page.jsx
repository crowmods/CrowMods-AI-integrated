use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function SecurityAdmin(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/admin/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SECURITY ADMIN</p>
      <h1>Identity & Audit Administration</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["OIDC Providers",data?.oidcProviders],
          ["Role Mappings",data?.roleMappings],
          ["Audit Exports",data?.auditExports],
          ["Security Correlations",data?.openCorrelations]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Security administration</h2>
        <p style={{opacity:.65}}>
          OIDC provider configuration, server-side role mapping,
          signed audit export, append-only storage, and security-event
          correlation.
        </p>
      </section>
    </div>
  </main>;
}
