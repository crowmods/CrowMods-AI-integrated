use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function FinalSecurity(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/final-status`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 99</p>
      <h1>Final Security Hardening</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Open Alerts",data?.openAlerts],
          ["Sent Escalations",data?.sentEscalations],
          ["Active Privileged Sessions",data?.activePrivilegedSessions],
          ["Evidence Exports / 30d",data?.evidenceExports30d]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{
        marginTop:30,padding:20,
        border:"1px solid #292932",
        borderRadius:12
      }}>
        <h2>Integration boundaries</h2>
        <p style={{opacity:.65}}>
          SIEM and evidence signing are explicit adapters. Replace the
          development adapters with approved production integrations before
          deployment.
        </p>
        <p style={{opacity:.65}}>
          SIEM: {data?.siem?.mode??"—"} · Evidence:
          {" "}{data?.evidence?.mode??"—"}
        </p>
      </section>
    </div>
  </main>;
}
