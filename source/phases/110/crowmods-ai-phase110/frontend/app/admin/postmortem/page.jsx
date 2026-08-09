use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Postmortem(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/postmortem-dashboard`)
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
        CROWMODS AI / PHASE 110
      </p>

      <h1>Post-Incident Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Timeline Events / 24h",
           data?.ingestedEvents24h],
          ["Signed Snapshots / 24h",
           data?.signedSnapshots24h],
          ["Overdue Actions / 24h",
           data?.overdueActions24h],
          ["Reports / 30d",
           data?.reports30d]
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
        Phase 110 makes incident timelines auditable, recovery snapshots
        tamper-evident, corrective actions measurable, and postmortems
        repeatable.
      </p>
    </div>
  </main>;
}
