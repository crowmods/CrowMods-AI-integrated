use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase124(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase124-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const cards=[
    ["Protected Resources / 30d",
      data?.protectedResourcesUpdated30d],
    ["Canary Cooldowns",
      data?.canaryRolloutsInCooldown],
    ["Active Takeover Claims / 24h",
      data?.activeTakeoverClaims24h],
    ["Calibration Window",
      data?.latestCalibrationWindow?.window_size??"—"],
    ["Escalated Alerts",
      data?.unacknowledgedEscalatedAlerts]
  ];

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 124</p>
      <h1>Transactional Resilience Control Plane</h1>

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
        Phase 124 introduces database SERIALIZABLE fencing,
        canary recovery cooldowns, atomic queue takeover fencing,
        adaptive calibration windows, and deduplicated alert escalation.
      </p>
    </div>
  </main>;
}
