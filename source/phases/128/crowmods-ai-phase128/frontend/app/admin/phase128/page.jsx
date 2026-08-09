use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase128(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase128-dashboard`)
      .then(r=>r.json()).then(setData);
  },[]);

  const cards=[
    ["Breaker Opens / 24h",data?.breakerOpens24h],
    ["Scheduled Recoveries",data?.scheduledRecoveries],
    ["Verified Takeovers / 30d",data?.verifiedTakeovers30d],
    ["Coverage",data?.latestSequentialCoverage?.coverage??"—"],
    ["Alert History / 30d",data?.alertHistoryEvents30d]
  ];

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 128</p>
      <h1>Automated Resilience & Governance Control Plane</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:12,
        marginTop:30
      }}>
        {cards.map(([label,value])=>
          <article key={label} style={{
            padding:18,
            border:"1px solid #292932",
            borderRadius:12
          }}>
            <strong>{label}</strong>
            <h2>{value??"—"}</h2>
          </article>
        )}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Phase 128 adds automatic dependency breaker transitions,
        persistent recovery scheduling, direct verified SQL takeover execution,
        sequential coverage monitoring, and complete alert acknowledgement history.
      </p>
    </div>
  </main>;
}
