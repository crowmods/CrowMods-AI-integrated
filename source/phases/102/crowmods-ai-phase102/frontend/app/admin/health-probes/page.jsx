use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function HealthProbes(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/health-dashboard`)
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
        CROWMODS AI / PHASE 102
      </p>

      <h1>Security Health Probes</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Pass / 24h",data?.passes24h],
          ["Warnings / 24h",data?.warnings24h],
          ["Failures / 24h",data?.failures24h],
          ["Open Health Alerts",data?.openAlerts]
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
        Security health probes continuously evaluate critical identity,
        certificate, database, SIEM, and KMS dependencies.
      </p>
    </div>
  </main>;
}
