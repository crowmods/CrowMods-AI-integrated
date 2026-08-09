use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function AuditIntegrity(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/audit/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / AUDIT INTEGRITY</p>
      <h1>Evidence Integrity</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(2,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Signed Evidence</strong>
          <h2>{data?.signedEvidence??"—"}</h2>
        </article>

        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Audit Records</strong>
          <h2>{data?.auditRecords??"—"}</h2>
        </article>
      </section>
    </div>
  </main>;
}
