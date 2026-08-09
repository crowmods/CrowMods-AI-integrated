use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ProductionAssurance(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/production-assurance-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const interval=data?.latestForecastInterval;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 120
      </p>

      <h1>Production Assurance</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Active Fencing Envelopes",
           data?.activeFencingEnvelopes],
          ["Promoted Rollouts / 30d",
           data?.promotedRollouts30d],
          ["Pending Delegation Jobs",
           data?.pendingDelegationJobs],
          ["Empirical Coverage",
           interval?.empirical_coverage??"—"],
          ["Valid KMS Verifications / 30d",
           data?.validKmsVerifications30d]
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
        Phase 120 binds downstream payloads to fencing state, models the
        canary rollout lifecycle, persists delegation scheduling, measures
        empirical forecast coverage, and verifies production KMS signatures.
      </p>
    </div>
  </main>;
}
