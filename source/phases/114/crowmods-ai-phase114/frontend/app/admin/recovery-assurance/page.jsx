use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function RecoveryAssurance(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/recovery-assurance-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const forecast=data?.latestForecast;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 114
      </p>

      <h1>Recovery & Assurance Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Active Worker Leases",
           data?.activeWorkerLeases],
          ["Retries / 24h",
           data?.retries24h],
          ["Active Risk Acceptances",
           data?.activeRiskAcceptances],
          ["Projected Assurance",
           forecast?.projected_score??"—"]
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
        Phase 114 adds durable worker execution, bounded retries, explicit
        risk acceptance expiry, and forward-looking assurance forecasting.
      </p>
    </div>
  </main>;
}
