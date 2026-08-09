use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase125(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase125-dashboard`)
      .then(r=>r.json()).then(setData);
  },[]);

  const cards=[
    ["Serializable Retries / 30d",
      data?.serializableRetries30d],
    ["Recovery Rollouts",
      data?.activeRecoveryRollouts],
    ["Successful Takeovers / 30d",
      data?.successfulTakeovers30d],
    ["Calibration Window",
      data?.latestCalibrationWindow?.window_size??"—"],
    ["Escalated Routes",
      data?.activeEscalatedRoutes]
  ];

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 125</p>
      <h1>Resilient Recovery Control Plane</h1>

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
        Phase 125 adds bounded serialization retries, staged canary recovery,
        transactional queue takeover, drift-aware calibration windows,
        and acknowledgement/suppression-aware alert routing.
      </p>
    </div>
  </main>;
}
