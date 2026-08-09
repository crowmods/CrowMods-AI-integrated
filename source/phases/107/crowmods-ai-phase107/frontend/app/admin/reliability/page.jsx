use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Reliability(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/reliability-dashboard`)
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
        CROWMODS AI / PHASE 107
      </p>

      <h1>Security Reliability</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Burn Alerts / 24h",data?.burnAlerts24h],
          ["Fail-Closed Events / 24h",
           data?.failClosedEvents24h],
          ["Reliability Reports / 30d",
           data?.reliabilityReports30d]
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
        Multi-window burn rates provide early warning while provider failover
        preserves security boundaries when critical dependencies fail.
      </p>
    </div>
  </main>;
}
