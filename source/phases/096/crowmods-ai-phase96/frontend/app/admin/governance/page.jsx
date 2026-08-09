use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Governance(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/governance`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / GOVERNANCE</p>
      <h1>Authorization Governance</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Policy Versions",data?.policyVersions],
          ["Approvals / 30d",data?.approvals30d],
          ["Open Access Reviews",data?.openAccessReviews],
          ["Governance Audit / 24h",data?.governanceAudit24h]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Governance controls</h2>
        <p style={{opacity:.65}}>
          Version history, rollback, independent approvals, and recurring
          access reviews provide a controlled lifecycle for privileged
          authorization changes.
        </p>
      </section>
    </div>
  </main>;
}
