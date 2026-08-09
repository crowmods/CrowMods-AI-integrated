use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function GovernanceRecovery(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/governance-recovery-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const forecast=data?.latestRiskForecast;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 117
      </p>

      <h1>Governance Recovery Assurance</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Active Fencing Tokens",
           data?.activeFencingTokens],
          ["Canary Replays / 30d",
           data?.successfulCanaryReplays30d],
          ["Expired Delegations / 30d",
           data?.expiredDelegations30d],
          ["Projected Risk",
           forecast?.projectedScore??"—"],
          ["Signed Decisions / 30d",
           data?.signedDecisionEvidence30d]
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
        Phase 117 adds stale-worker protection, safe DLQ replay validation,
        delegation lifecycle controls, forward risk forecasting, and signed
        executive decisions.
      </p>
    </div>
  </main>;
}
