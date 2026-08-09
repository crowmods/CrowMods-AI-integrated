use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function LiveHealth(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/live-health-dashboard`)
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
        CROWMODS AI / PHASE 103
      </p>

      <h1>Live Security Health</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Pass / 24h",data?.passes24h],
          ["Failures / 24h",data?.failures24h],
          ["Pending Remediation",data?.pendingRemediation],
          ["Signed Evidence / 24h",data?.signedEvidence24h]
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

      <section style={{
        marginTop:30,
        padding:20,
        border:"1px solid #292932",
        borderRadius:12
      }}>
        <h2>Controlled remediation</h2>
        <p style={{opacity:.65}}>
          High-risk remediation requires independent approval. Execution is
          routed through a controlled adapter and does not silently mutate
          external infrastructure.
        </p>
      </section>
    </div>
  </main>;
}
