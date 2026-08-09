use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Integrations(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/integration-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 104
      </p>

      <h1>Production Security Integrations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Signing Operations / 24h",
           data?.signedOperations24h],
          ["SIEM Events / 24h",
           data?.deliveredSiemEvents24h],
          ["Valid Certificates / 24h",
           data?.validCertificates24h]
        ].map(([label,value])=><article key={label}
          style={{
            padding:18,
            border:"1px solid #292932",
            borderRadius:12
          }}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        KMS/HSM signing, certificate validation, and authenticated SIEM
        delivery are separated behind explicit production adapters.
      </p>
    </div>
  </main>;
}
