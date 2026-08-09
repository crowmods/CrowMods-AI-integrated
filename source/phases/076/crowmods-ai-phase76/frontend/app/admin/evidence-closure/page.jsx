use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function EvidenceClosure(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/evidence/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / EVIDENCE</p>
      <h1>Recovery Evidence & Closure</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Evidence Records</strong>
          <h2>{data?.evidenceCount??"—"}</h2>
        </article>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Postmortem States</strong>
          <h2>{data?.packages?.length??"—"}</h2>
        </article>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Approval States</strong>
          <h2>{data?.approvals?.length??"—"}</h2>
        </article>
      </section>
    </div>
  </main>;
}
