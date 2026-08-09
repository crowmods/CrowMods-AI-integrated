use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function SecuritySlo(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/slo-dashboard`)
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
        CROWMODS AI / PHASE 105
      </p>

      <h1>Security SLO Monitoring</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["SLO Passes / 24h",data?.sloPasses24h],
          ["SLO Breaches / 24h",data?.sloBreaches24h],
          ["Open SLO Alerts",data?.openSloAlerts],
          ["Accepted Workload Identity / 24h",
           data?.acceptedWorkloadIdentity24h]
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
        Security SLOs turn authentication, SIEM, KMS, certificate, and
        monitoring reliability into measurable operational targets.
      </p>
    </div>
  </main>;
}
