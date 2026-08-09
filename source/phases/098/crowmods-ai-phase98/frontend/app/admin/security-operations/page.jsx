use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function SecurityOperations(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/operations-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SECURITY OPERATIONS</p>
      <h1>Security Operations Center</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Open Alerts",data?.openAlerts],
          ["Active Privileged Sessions",data?.activePrivilegedSessions],
          ["Signed Evidence / 30d",data?.signedEvidence30d],
          ["Triage Events / 24h",data?.triageEvents24h]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Evidence integrity</h2>
        <p style={{opacity:.65}}>
          Signed governance evidence is tracked with a digest, signing-key
          version, and verification endpoint. The bundled signer is a
          development simulation and must be replaced with KMS/HSM in production.
        </p>
      </section>
    </div>
  </main>;
}
