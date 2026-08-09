use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Orchestration(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/orchestration-dashboard`)
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
        CROWMODS AI / PHASE 108
      </p>

      <h1>Security Orchestration</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Exhaustion Forecasts / 24h",
           data?.exhaustionForecasts24h],
          ["High-Confidence Correlations / 24h",
           data?.highConfidenceCorrelations24h],
          ["Active Recoveries",
           data?.activeRecoveries]
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
        Forecasting provides early warning, correlation links incidents to
        changes and provider events, and recovery requires validation before
        sensitive operations are restored.
      </p>
    </div>
  </main>;
}
