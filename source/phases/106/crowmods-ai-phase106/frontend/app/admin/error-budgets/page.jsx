use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ErrorBudgets(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/error-budget-dashboard`)
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
        CROWMODS AI / PHASE 106
      </p>

      <h1>Security Error Budgets</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Healthy / 24h",data?.healthyBudgets24h],
          ["Warning / 24h",data?.warningBudgets24h],
          ["Exhausted / 24h",data?.exhaustedBudgets24h],
          ["Burn Alerts / 24h",data?.burnAlerts24h]
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
        Error budgets measure how much security-service failure is acceptable
        before reliability risk becomes an operational security concern.
      </p>
    </div>
  </main>;
}
