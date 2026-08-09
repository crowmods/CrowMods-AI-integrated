use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function RiskRegister(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/risk-register-dashboard`)
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
        CROWMODS AI / PHASE 115
      </p>

      <h1>Executive Risk Register</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Open Executive Risks",
           data?.openExecutiveRisks],
          ["Critical Risks",
           data?.criticalRisks],
          ["Open Dead-Letter Jobs",
           data?.openDeadLetterJobs],
          ["Active Worker Locks",
           data?.activeWorkerLocks]
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
        Phase 115 adds distributed execution safety, bounded failure routing,
        approval chains, and an executive-level residual risk register.
      </p>
    </div>
  </main>;
}
