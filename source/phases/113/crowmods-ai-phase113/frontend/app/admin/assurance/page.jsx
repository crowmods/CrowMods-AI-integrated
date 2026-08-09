use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Assurance(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/assurance-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const latest=data?.latestAssuranceScore;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 113
      </p>

      <h1>Executive Security Assurance</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Verified KMS Events / 30d",
           data?.verifiedKmsEvents30d],
          ["Active Control Jobs",
           data?.activeControlJobs],
          ["Critical Control Priorities",
           data?.criticalControlPriorities],
          ["Latest Assurance Score",
           latest?.score??"—"]
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
        Phase 113 combines verified evidence, durable testing, risk-based
        prioritization, and executive assurance into one measurable view.
      </p>
    </div>
  </main>;
}
