use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase121(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase121-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const forecast=data?.latestForecastCalibration;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 121
      </p>

      <h1>Cloud Assurance Control Plane</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Blocked Fencing Transactions / 30d",
           data?.blockedFencingTransactions30d],
          ["Active Canary Stages / 24h",
           data?.activeCanaryStages24h],
          ["Active Delegation Claims",
           data?.activeDelegationClaims],
          ["Forecast Coverage",
           forecast?.coverage??"—"],
          ["Successful KMS Operations / 30d",
           data?.successfulKmsOperations30d]
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
        Phase 121 adds transactional fencing checks, progressive canary
        traffic, leased queue claims, quantile-based forecast calibration,
        and provider-neutral cloud KMS adapters.
      </p>
    </div>
  </main>;
}
