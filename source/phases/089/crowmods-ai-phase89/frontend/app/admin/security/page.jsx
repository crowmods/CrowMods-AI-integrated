use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function SecurityCenter(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/operations`,{
      headers:{
        "x-auth-subject":"demo-operator",
        "x-auth-provider":"development-idp",
        "x-auth-roles":"ops.viewer"
      }
    })
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SECURITY</p>
      <h1>Security & Audit Center</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Active Sessions",data?.activeSessions],
          ["SLO Alert Rules",data?.activeRules],
          ["Open SLO Alerts",data?.openSloAlerts],
          ["Audit Events / 24h",data?.auditEvents24h]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Security controls</h2>
        <p style={{opacity:.65}}>
          Trusted identity context, automated SLO alert evaluation,
          request correlation, chained audit records, and integrity
          verification.
        </p>
      </section>
    </div>
  </main>;
}
