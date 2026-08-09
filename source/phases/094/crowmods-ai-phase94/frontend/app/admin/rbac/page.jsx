use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function RbacAdmin(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/rbac-operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RBAC</p>
      <h1>Policy Authorization Center</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Active Policies",data?.activePolicies],
          ["Decisions / 24h",data?.decisions24h],
          ["Denied / 24h",data?.denied24h]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Deny by default</h2>
        <p style={{opacity:.65}}>
          Access requires a matching enabled policy and a role obtained from
          the validated identity context. Unmatched requests are denied.
        </p>
      </section>
    </div>
  </main>;
}
