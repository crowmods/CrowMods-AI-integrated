use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase134(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase134-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Retention Authorizations / 30d",
   d?.retentionAuthorizations30d],
  ["Rolling Retry Baselines",
   d?.rollingRetryBaselines],
  ["Calibration Checkpoints",
   d?.calibrationCheckpoints],
  ["Verified Integrity / 30d",
   d?.verifiedIntegrityRecords30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 134</p>
   <h1>Authorized Retention & Integrity Control Plane</h1>

   <section style={{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:12,
    marginTop:30
   }}>
    {cards.map(([label,value])=>
     <article key={label} style={{
      padding:18,
      border:"1px solid #292932",
      borderRadius:12
     }}>
      <strong>{label}</strong>
      <h2>{value??"—"}</h2>
     </article>
    )}
   </section>
  </div>
 </main>;
}
