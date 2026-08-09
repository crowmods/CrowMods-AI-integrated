use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function GovernanceEnforcement(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/governance-enforcement-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const forecast=data?.latestForecastConfidence;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 118
      </p>

      <h1>Governance Enforcement</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Blocked Fencing Events / 30d",
           data?.blockedFencingEvents30d],
          ["Promoted Canaries / 30d",
           data?.promotedCanaries30d],
          ["Revocations / 30d",
           data?.executedRevocations30d],
          ["Forecast Confidence",
           forecast?.confidence??"—"],
          ["Signed Bundles / 30d",
           data?.signedBundles30d]
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
        Phase 118 turns governance safeguards into enforceable runtime gates,
        controlled promotion, automated delegation cleanup, confidence-aware
        forecasting, and signed evidence bundles.
      </p>
    </div>
  </main>;
}
