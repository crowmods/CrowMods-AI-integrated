use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function IncidentReview(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/incident-review-dashboard`)
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
        CROWMODS AI / PHASE 109
      </p>

      <h1>Incident Review & Evidence</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Timeline Events / 24h",
           data?.timelineEvents24h],
          ["Signed Recovery Evidence / 24h",
           data?.signedRecoveryEvidence24h],
          ["Open Post-Incident Reviews",
           data?.openReviews]
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
        Incident timelines, deployment correlation, recovery evidence, and
        post-incident actions provide a traceable security review lifecycle.
      </p>
    </div>
  </main>;
}
