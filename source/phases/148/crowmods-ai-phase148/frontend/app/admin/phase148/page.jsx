use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase148(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase148-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Approved Redrives / 30d",d?.approvedRedrives30d],
  ["Replay Safeguard Blocks / 24h",
   d?.replaySafeguardBlocks24h],
  ["Critical Hysteresis States",
   d?.criticalHysteresisStates],
  ["Evidence Anchors / 30d",
   d?.evidenceAnchors30d],
  ["Valid Closure Reports / 30d",
   d?.validClosureReports30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 148</p>
   <h1>Approval, Replay, Hysteresis & Evidence Control Plane</h1>

   <section style={{
    display:"grid",
    gridTemplateColumns:"repeat(5,1fr)",
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
