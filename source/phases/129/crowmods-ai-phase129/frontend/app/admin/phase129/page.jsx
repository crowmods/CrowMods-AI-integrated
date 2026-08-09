use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase129(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase129-dashboard`)
      .then(r=>r.json()).then(setData);
  },[]);

  const cards=[
    ["Open Breaker Jobs",data?.openBreakerJobs],
    ["Active Recovery Leases",data?.activeRecoveryLeases],
    ["Successful Takeover Retries / 30d",
      data?.successfulTakeoverRetries30d],
    ["Latest Calibration Action",
      data?.latestCalibrationAction??"—"],
    ["Alert Reviews / 30d",
      data?.alertReviewQueries30d]
  ];

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 129</p>
      <h1>Persistent Reliability & Review Control Plane</h1>

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
        Phase 129 adds persistent breaker cooldown workers,
        lease-fenced recovery scheduling, bounded serialization retries
        for takeovers, confidence-aware calibration actions, and alert
        history review queries.
      </p>
    </div>
  </main>;
}
