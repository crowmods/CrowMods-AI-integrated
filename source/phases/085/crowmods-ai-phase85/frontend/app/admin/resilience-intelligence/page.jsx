use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ResilienceIntelligence(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/intelligence/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / INTELLIGENCE</p>
      <h1>Resilience Intelligence</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Anomalies",data?.anomalies],
          ["Open Alerts",data?.openAlerts],
          ["Active Routes",data?.activeRoutes],
          ["Executive Reports",data?.executiveReports]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Multi-window forecasting, anomaly scoring, alert deduplication,
        escalation, and executive reporting.
      </p>
    </div>
  </main>;
}
