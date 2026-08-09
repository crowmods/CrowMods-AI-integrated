use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase145(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase145-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Failed Repairs / 30d",d?.failedRepairs30d],
  ["Burn-Rate Breaches / 24h",
   d?.burnRateBreaches24h],
  ["Lease Conflicts / 30d",
   d?.leaseConflicts30d],
  ["Reprocessing Transitions / 30d",
   d?.reprocessingTransitions30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 145</p>
   <h1>Repair Execution & Reliability Control Plane</h1>

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
