use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function SecurityDetection(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/detection-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SECURITY DETECTION</p>
      <h1>Governance Detection Center</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Open Security Alerts",data?.openAlerts],
          ["Policy Conflicts",data?.openPolicyConflicts],
          ["Pending Reviews",data?.pendingReviewAssignments],
          ["Evidence / 30d",data?.evidence30d]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Automated access-review generation, privileged-action anomaly
        scoring, policy conflict analysis, and governance evidence hashes.
      </p>
    </div>
  </main>;
}
