use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Governance(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/governance-dashboard`)
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
        CROWMODS AI / PHASE 112
      </p>

      <h1>Governance & Assurance</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Verified Evidence / 30d",
           data?.verifiedEvidence30d],
          ["Mapped Governance Controls",
           data?.mappedGovernanceControls],
          ["Declining Controls / 30d",
           data?.decliningControls30d]
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
        Evidence verification, scheduled control testing, effectiveness trends,
        and governance mappings provide a measurable assurance layer.
      </p>
    </div>
  </main>;
}
