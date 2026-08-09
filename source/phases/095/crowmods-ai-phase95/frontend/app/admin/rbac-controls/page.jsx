use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function RbacControls(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/rbac-controls`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RBAC CONTROLS</p>
      <h1>Scoped Authorization</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Active Roles",data?.activeRoles],
          ["Active Scopes",data?.activeScopes],
          ["Pending Changes",data?.pendingChanges],
          ["Change Audit / 24h",data?.changeAudit24h]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Approval-ready changes</h2>
        <p style={{opacity:.65}}>
          RBAC mutations can be submitted as change requests and independently
          approved by an authorized approver.
        </p>
      </section>
    </div>
  </main>;
}
