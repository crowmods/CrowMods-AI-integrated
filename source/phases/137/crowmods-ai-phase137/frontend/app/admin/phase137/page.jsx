use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase137(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase137-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Escalated Alerts",d?.escalatedAlerts],
  ["Checkpoint Writes / 30d",
   d?.committedCheckpointWrites],
  ["Manifest Worker Runs / 30d",
   d?.manifestWorkerRuns30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 137</p>
   <h1>Fenced Checkpoint & Manifest Worker Control Plane</h1>

   <section style={{
    display:"grid",
    gridTemplateColumns:"repeat(3,1fr)",
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
