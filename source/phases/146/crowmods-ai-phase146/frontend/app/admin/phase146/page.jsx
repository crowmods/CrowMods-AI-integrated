use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase146(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase146-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Dead-Letter Repairs / 30d",
   d?.deadLetterRepairs30d],
  ["Multi-Window Burn Breaches / 24h",
   d?.multiWindowBurnBreaches24h],
  ["Lease Conflict Rate Breaches / 30d",
   d?.leaseConflictRateBreaches30d],
  ["Immutable Closures / 30d",
   d?.immutableClosures30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 146</p>
   <h1>Backoff, Burn-Rate & Closure Control Plane</h1>

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
