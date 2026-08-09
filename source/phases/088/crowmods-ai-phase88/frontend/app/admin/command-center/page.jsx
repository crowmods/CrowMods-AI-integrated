use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function CommandCenter(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/operations/command-center`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / COMMAND CENTER</p>
      <h1>Operational Command Center</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Incident States</strong>
          <h2>{data?.incidents?.length??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Active SLO Policies</strong>
          <h2>{data?.activeSloPolicies??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Operators</strong>
          <h2>{data?.activeOperators??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Audit Events / 24h</strong>
          <h2>{data?.auditEvents24h??"—"}</h2>
        </article>
      </section>

      <section style={{marginTop:30}}>
        <h2>SLO-aware operations</h2>
        <p style={{opacity:.65}}>
          Burn-rate analysis, incident timelines, RBAC-protected operator
          actions, and enforced audit records.
        </p>
      </section>
    </div>
  </main>;
}
