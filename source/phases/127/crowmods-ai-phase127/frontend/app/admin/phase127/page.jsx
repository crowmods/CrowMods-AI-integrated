use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase127(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase127-dashboard`)
      .then(r=>r.json()).then(setData);
  },[]);

  const cards=[
    ["Open Dependencies",data?.openDependencies],
    ["Persistent Canary Cooldowns",data?.canaryCooldowns],
    ["Verified Takeovers / 30d",data?.verifiedTakeovers30d],
    ["Coverage",data?.latestCoverageConfidence?.coverage??"—"],
    ["Acknowledged Alerts / 30d",data?.acknowledgedAlerts30d]
  ];

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 127</p>
      <h1>Dependency & Governance Control Plane</h1>

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
        Phase 127 adds dependency-specific circuit metrics,
        persistent canary cooldowns, enforced takeover verification,
        coverage confidence intervals, and alert acknowledgement workflows.
      </p>
    </div>
  </main>;
}
